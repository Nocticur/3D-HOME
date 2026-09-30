import { describe, expect, it } from 'vitest';

import { feedsConfig, linksConfig, profileConfig } from './index';
import { searchDocuments } from '@/utils/search-index';

describe('Nocticur adaptation', () => {
  it('keeps the four monitor destinations on the official blog origin', () => {
    expect(linksConfig.map(({ id, url }) => [id, url])).toEqual([
      ['blog', 'https://blog.mourn.top/'],
      ['dynamic', 'https://blog.mourn.top/dynamic/'],
      ['life', 'https://blog.mourn.top/life/notebooks/'],
      ['about', 'https://blog.mourn.top/about/'],
    ]);
  });

  it('indexes blog shortcuts with collision-safe identifiers', () => {
    expect(searchDocuments('文章列表')).toContainEqual(
      expect.objectContaining({
        id: 'shortcut:blog:articles',
        kind: '博客入口',
        url: 'https://blog.mourn.top/list/',
      }),
    );
  });

  it('replaces the original blog feed while keeping 21 feeds and fetching it by default', () => {
    expect(feedsConfig).toHaveLength(21);
    expect(feedsConfig[0]).toMatchObject({
      defaultFetch: true,
      enabled: true,
      feedUrl: 'https://blog.mourn.top/rss.xml',
      id: 'nocticur-blog',
      siteUrl: 'https://blog.mourn.top',
    });
    expect(feedsConfig.some(({ id }) => id === 'mmzhiku-blog')).toBe(false);
  });

  it('updates public identity without changing the 3D scene introduction', () => {
    expect(profileConfig.name).toBe('Nocticur');
    expect(profileConfig.github.username).toBe('Nocticur');
    expect(profileConfig.intro.role).toBe('零手戳/三无产品制图师');
    expect(profileConfig.intro.sticker).toBe('/assets/images/profile/home2.webp');
    expect(profileConfig.socialLinks.map(({ url }) => url)).toEqual(
      expect.arrayContaining([
        'https://space.bilibili.com/645892937',
        'https://qm.qq.com/q/2R07cjGTZ0',
      ]),
    );
  });
});
