import { describe, expect, it } from 'vitest';

import { handleRobotsGet, handleSitemapGet } from './seo';

const requestContext = (url: string, env: Record<string, string | undefined> = {}) => ({
  env,
  request: new Request(url),
  waitUntil: () => undefined,
});

describe('canonical SEO endpoints', () => {
  it('points robots.txt and the sitemap to the configured public home domain', async () => {
    const robots = await handleRobotsGet(
      requestContext('https://preview.example/robots.txt'),
    ).text();
    const sitemap = await handleSitemapGet(
      requestContext('https://preview.example/sitemap.xml'),
    ).text();

    expect(robots).toContain('Sitemap: https://home.mourn.top/sitemap.xml');
    expect(sitemap).toContain('<loc>https://home.mourn.top/</loc>');
    expect(robots).not.toContain('preview.example');
  });

  it('blocks indexing on Vercel preview deployments', async () => {
    const robots = await handleRobotsGet(
      requestContext('https://preview.example/robots.txt', { VERCEL_ENV: 'preview' }),
    ).text();

    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Sitemap:');
  });
});
