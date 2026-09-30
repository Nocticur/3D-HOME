import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleFeedsGet } from './feeds';
import { fetchWithTimeout } from './shared';

const requestContext = (url: string) => ({
  env: {},
  request: new Request(url),
  waitUntil: (promise: Promise<unknown>) => void promise.catch(() => undefined),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Nocticur RSS integration', () => {
  it('uses RSS content:encoded when description and summary are empty', async () => {
    const xml =
      '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>独立文章标题</title><link>https://blog.mourn.top/posts/independent/</link><description></description><content:encoded><![CDATA[<script>window.bad()</script><p>这是来自正文的摘要内容</p>]]></content:encoded><pubDate>Tue, 29 Sep 2026 08:00:00 GMT</pubDate></item></channel></rss>';
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Response(xml, { headers: { 'content-type': 'application/rss+xml' } })),
    );

    const response = await handleFeedsGet(
      requestContext('https://nocticur-test.example/api/feeds?sources=nocticur-blog'),
    );
    const body = (await response.json()) as {
      data?: { articles?: { excerpt: string; url: string }[] };
    };

    expect(response.status).toBe(200);
    expect(body.data?.articles?.[0]).toMatchObject({
      excerpt: '这是来自正文的摘要内容',
      url: 'https://blog.mourn.top/posts/independent/',
    });
  });

  it('continues to return a retryable source failure when RSS access is blocked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Response('Cloudflare challenge', {
            status: 403,
            headers: { 'content-type': 'text/html' },
          }),
      ),
    );

    const response = await handleFeedsGet(
      requestContext('https://nocticur-blocked.example/api/feeds?sources=nocticur-blog'),
    );
    const body = (await response.json()) as {
      data?: { articles?: unknown[]; failures?: { feedId: string; retryable: boolean }[] };
    };

    expect(response.status).toBe(200);
    expect(body.data?.articles).toEqual([]);
    expect(body.data?.failures).toContainEqual({
      feedId: 'nocticur-blog',
      message: 'Nocticur 的博客 暂时无法获取。',
      retryable: true,
    });
  });
});

describe('upstream request deadlines', () => {
  it('keeps the timeout active until the response body has been consumed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: URL, init?: RequestInit) => {
        const signal = init?.signal;
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              const timer = setTimeout(() => {
                controller.enqueue(new TextEncoder().encode('late body'));
                controller.close();
              }, 100);
              signal?.addEventListener(
                'abort',
                () => {
                  clearTimeout(timer);
                  controller.error(signal.reason);
                },
                { once: true },
              );
            },
          }),
        );
      }),
    );

    await expect(
      fetchWithTimeout(new URL('https://upstream.example/data'), {}, 20, (response) =>
        response.text(),
      ),
    ).rejects.toThrow();
  });
});
