import { z } from 'zod';

export interface EdgeContext {
  env: Record<string, string | undefined>;
  geo?: EdgeGeo | null;
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

export interface EdgeGeo {
  city?: string | undefined;
  latitude: number;
  longitude: number;
  region?: string | undefined;
}

interface EdgeCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response, ttlSeconds?: number): Promise<void>;
}

interface LocalCacheEntry {
  expiresAt: number;
  response: Response;
}

const localCache = new Map<string, LocalCacheEntry>();
const maxLocalCacheEntries = 128;

const edgeRequestSchema = z.object({
  eo: z
    .object({
      geo: z
        .object({
          city: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          region: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export function getEdgeGeo(request: Request, platformGeo?: EdgeGeo | null): EdgeGeo | null {
  const geo = platformGeo ?? getRequestGeo(request);
  if (geo === null) return null;
  const { latitude, longitude } = geo;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { city: geo.city, latitude, longitude, region: geo.region };
}

function getRequestGeo(request: Request): EdgeGeo | null {
  const parsed = edgeRequestSchema.safeParse(request);
  const source = parsed.success ? parsed.data.eo?.geo : undefined;
  const latitude = source?.latitude;
  const longitude = source?.longitude;

  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { city: source?.city, latitude, longitude, region: source?.region };
}

function responseCacheTtl(response: Response) {
  const cacheControl = response.headers.get('cache-control') ?? '';
  const maxAge = /(?:^|,)\s*s-maxage=(\d+)/i.exec(cacheControl)?.[1];
  const fallback = /(?:^|,)\s*max-age=(\d+)/i.exec(cacheControl)?.[1];
  return Math.max(0, Number(maxAge ?? fallback ?? 60));
}

export function getEdgeCache(): EdgeCache {
  const platformCache = (globalThis as { caches?: { default?: EdgeCache } }).caches?.default;
  if (platformCache !== undefined) return platformCache;

  return {
    match(request) {
      const entry = localCache.get(request.url);
      if (entry === undefined) return Promise.resolve(undefined);
      if (entry.expiresAt <= Date.now()) {
        localCache.delete(request.url);
        return Promise.resolve(undefined);
      }
      localCache.delete(request.url);
      localCache.set(request.url, entry);
      return Promise.resolve(entry.response.clone());
    },
    put(request, response, ttlSeconds) {
      const ttl = ttlSeconds ?? responseCacheTtl(response);
      if (ttl <= 0) return Promise.resolve();
      localCache.delete(request.url);
      localCache.set(request.url, {
        expiresAt: Date.now() + ttl * 1_000,
        response: response.clone(),
      });
      while (localCache.size > maxLocalCacheEntries) {
        const oldestKey = localCache.keys().next();
        if (oldestKey.done) break;
        localCache.delete(oldestKey.value);
      }
      return Promise.resolve();
    },
  };
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function success(data: unknown, requestId: string, init?: ResponseInit) {
  const headers = new Headers(init?.headers ?? {});
  headers.set('content-type', 'application/json; charset=UTF-8');
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 's-maxage=900, stale-while-revalidate=3600');
  }

  return new Response(
    JSON.stringify({
      data,
      meta: { cachedAt: new Date().toISOString(), requestId, stale: false },
    }),
    { ...init, headers },
  );
}

export function failure(
  code: string,
  message: string,
  requestId: string,
  retryable: boolean,
  status: number,
) {
  return new Response(JSON.stringify({ error: { code, message, requestId, retryable } }), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=UTF-8',
    },
    status,
  });
}

export async function fetchWithTimeout<T>(
  url: URL,
  init: RequestInit,
  timeoutMs: number,
  consume: (response: Response) => Promise<T>,
): Promise<{ data: T; response: Response }> {
  const controller = new AbortController();
  const signal =
    init.signal == null ? controller.signal : AbortSignal.any([controller.signal, init.signal]);
  const timeoutError = new DOMException('Upstream request timed out.', 'TimeoutError');
  const timeout = setTimeout(() => {
    controller.abort(timeoutError);
  }, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal });
    const data = await consume(response);
    return { data, response };
  } catch (error) {
    if (controller.signal.reason === timeoutError)
      throw new Error('upstream-timeout', { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function readTextWithLimit(response: Response, maxBytes: number) {
  if (response.body === null) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let result = '';

  try {
    let done = false;
    while (!done) {
      const chunk = await reader.read();
      if (chunk.done) {
        done = true;
        continue;
      }
      bytesRead += chunk.value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        throw new Error('response-too-large');
      }
      result += decoder.decode(chunk.value, { stream: true });
    }
    return result + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export function isPublicHttpsUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return false;
  if (/^(0|10|127)\.|^169\.254\.|^172\.(1[6-9]|2\d|3[0-1])\.|^192\.168\./.test(hostname)) {
    return false;
  }
  if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')) return false;
  return true;
}
