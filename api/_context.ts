import { geolocation, waitUntil } from '@vercel/functions';

import type { EdgeContext, EdgeGeo } from '../src/api/edge/shared.ts';

function requestGeo(request: Request): EdgeGeo | null {
  const location = geolocation(request);
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    location.latitude === undefined ||
    location.longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    ...(location.city === undefined ? {} : { city: location.city }),
    ...(location.countryRegion === undefined ? {} : { region: location.countryRegion }),
  };
}

export function createVercelContext(request: Request): EdgeContext {
  return {
    env: process.env,
    geo: requestGeo(request),
    request,
    waitUntil(promise) {
      waitUntil(promise);
    },
  };
}
