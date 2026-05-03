import { normalizeFeatureCollection } from '../map/overlay.js';

const cache = new Map();

export async function loadDataset(fileName, signal) {
  if (cache.has(fileName)) {
    return cache.get(fileName);
  }

  const response = await fetch(`/geojson_data/${fileName}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const features = normalizeFeatureCollection(raw, fileName);
  const payload = { fileName, features, raw };

  cache.set(fileName, payload);
  return payload;
}

export function clearDatasetCache() {
  cache.clear();
}
