#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultSourceDirectory = resolve(root, 'geojson_data');
const defaultAssetDirectory = resolve(root, 'geojson_images');
const pythonWebpConverter = String.raw`
from PIL import Image
import sys

source_path = sys.argv[1]
target_path = sys.argv[2]
quality = int(sys.argv[3])

with Image.open(source_path) as image:
    image.save(target_path, format='WEBP', quality=quality, method=6)
`;

function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'feature';
}

function isExternalImageReference(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) && !trimmed.startsWith('data:'))
  );
}

function decodeBase64Image(value) {
  if (typeof value !== 'string') {
    throw new Error('Expected image data to be a string.');
  }

  const trimmed = value.trim();
  const base64 = trimmed.startsWith('data:') ? trimmed.slice(trimmed.indexOf(',') + 1) : trimmed;

  return Buffer.from(base64, 'base64');
}

async function convertPngToWebp(sourcePath, targetPath, quality) {
  await execFileAsync('python3', ['-c', pythonWebpConverter, sourcePath, targetPath, String(quality)]);
}

async function transcodeImagePayload(payload, { quality, tempDirectory, outputPath }) {
  const pngPath = resolve(tempDirectory, 'source.png');
  await writeFile(pngPath, decodeBase64Image(payload));
  await convertPngToWebp(pngPath, outputPath, quality);
  await rm(pngPath, { force: true });
}

function rewriteFeatureImage(feature, { batchStem, featureIndex }) {
  const properties = feature?.properties ?? {};
  const image = properties.image;

  if (typeof image !== 'string' || image.trim() === '' || isExternalImageReference(image)) {
    return null;
  }

  const featureStem = slugify(properties.name ?? `feature-${featureIndex + 1}`);
  const fileName = `${String(featureIndex + 1).padStart(3, '0')}-${featureStem}.webp`;
  const relativePath = `/geojson_images/${batchStem}/${fileName}`;

  return {
    image,
    relativePath,
    fileName,
  };
}

export async function migrateGeojsonImages({
  sourceDirectory = defaultSourceDirectory,
  assetDirectory = defaultAssetDirectory,
  quality = 82,
} = {}) {
  await mkdir(assetDirectory, { recursive: true });

  const entries = (await readdir(sourceDirectory)).filter((file) => extname(file).toLowerCase() === '.geojson').sort();
  const results = [];

  for (const fileName of entries) {
    const sourcePath = resolve(sourceDirectory, fileName);
    const batchStem = basename(fileName, '.geojson');
    const batchAssetDirectory = resolve(assetDirectory, batchStem);
    const source = await readFile(sourcePath, 'utf8');
    const collection = JSON.parse(source);

    if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
      throw new Error(`Invalid GeoJSON feature collection in ${fileName}`);
    }

    let convertedCount = 0;
    const tempDirectory = await mkdtemp(resolve(tmpdir(), 'geojson-image-migration-'));

    try {
      for (const [featureIndex, feature] of collection.features.entries()) {
        const rewriteResult = rewriteFeatureImage(feature, { batchStem, featureIndex });

        if (!rewriteResult) {
          continue;
        }

        const properties = feature.properties ?? {};
        const outputPath = resolve(batchAssetDirectory, rewriteResult.fileName);
        await mkdir(batchAssetDirectory, { recursive: true });
        await transcodeImagePayload(rewriteResult.image, {
          quality,
          tempDirectory,
          outputPath,
        });
        feature.properties = {
          ...properties,
          image: rewriteResult.relativePath,
        };
        convertedCount += 1;
      }
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }

    await writeFile(sourcePath, `${JSON.stringify(collection)}\n`, 'utf8');
    results.push({ fileName, convertedCount });
  }

  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await migrateGeojsonImages();
  const totalConverted = results.reduce((sum, result) => sum + result.convertedCount, 0);

  console.log(`Converted ${totalConverted} images across ${results.length} GeoJSON batches.`);
}
