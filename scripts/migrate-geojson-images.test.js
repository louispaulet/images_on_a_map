import { mkdir, readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { migrateGeojsonImages } from './migrate-geojson-images.mjs';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO2q4t8AAAAASUVORK5CYII=';

describe('migrateGeojsonImages', () => {
  it('writes webp assets and rewrites geojson image references', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'geojson-image-test-'));
    const sourceDirectory = resolve(tempRoot, 'geojson_data');
    const assetDirectory = resolve(tempRoot, 'geojson_images');

    try {
      await mkdir(sourceDirectory, { recursive: true });
      await mkdir(assetDirectory, { recursive: true });
      await writeFile(
        resolve(sourceDirectory, 'sample-batch.geojson'),
        JSON.stringify({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [2.1, 46.9] },
              properties: { name: 'France', image: ONE_PIXEL_PNG },
            },
          ],
        }),
        'utf8',
      );

      await migrateGeojsonImages({ sourceDirectory, assetDirectory, quality: 80 });

      const rewritten = JSON.parse(await readFile(resolve(sourceDirectory, 'sample-batch.geojson'), 'utf8'));
      const imagePath = rewritten.features[0].properties.image;
      const webp = await readFile(resolve(tempRoot, imagePath.slice(1)));

      expect(imagePath).toBe('/geojson_images/sample-batch/001-france.webp');
      expect(webp.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
