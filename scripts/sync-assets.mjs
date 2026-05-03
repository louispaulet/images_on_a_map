import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetPairs = [
  ['geojson_data', 'public/geojson_data'],
  ['geojson_images', 'public/geojson_images'],
];

for (const [sourceRelPath, targetRelPath] of assetPairs) {
  const source = resolve(root, sourceRelPath);
  const target = resolve(root, targetRelPath);

  await rm(target, { recursive: true, force: true });

  try {
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

console.log('Synced GeoJSON assets to public/');
