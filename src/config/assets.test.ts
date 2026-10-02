import { describe, expect, it } from 'vitest';

const configFiles = import.meta.glob<unknown>('./*.json', {
  eager: true,
  import: 'default',
});
const publicAssets = import.meta.glob('/public/assets/**/*');

function collectAssetPaths(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.startsWith('/assets/') ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectAssetPaths);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectAssetPaths);
  }

  return [];
}

describe('configured public assets', () => {
  it('ships every local asset referenced by configuration', () => {
    const assetPaths = [...new Set(Object.values(configFiles).flatMap(collectAssetPaths))];
    const missingPaths = assetPaths.filter(
      (assetPath) => !Object.hasOwn(publicAssets, `/public${assetPath}`),
    );

    expect(assetPaths.length).toBeGreaterThan(0);
    expect(missingPaths).toEqual([]);
  });
});
