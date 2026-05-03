import { describe, expect, it } from 'vitest';
import { normalizeFeatureCollection, projectAnchors } from './overlay.js';
import { collections } from '../data/catalog.js';

describe('catalog', () => {
  it('keeps the original 12 content groups and 28 batch files', () => {
    const batchCount = collections.reduce((total, collection) => total + collection.batches.length, 0);

    expect(collections).toHaveLength(12);
    expect(batchCount).toBe(28);
  });
});

describe('normalizeFeatureCollection', () => {
  it('turns point features into anchored image records', () => {
    const features = normalizeFeatureCollection(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.0992, 46.895] },
            properties: { name: 'France', image: 'abc123' },
          },
        ],
      },
      'sample-batch.geojson',
    );

    expect(features).toEqual([
      expect.objectContaining({
        id: 'sample-batch.geojson-0-France',
        name: 'France',
        imageSrc: 'data:image/png;base64,abc123',
        lng: 2.0992,
        lat: 46.895,
      }),
    ]);
  });
});

describe('projectAnchors', () => {
  it('projects anchors into viewport space', () => {
    const anchors = projectAnchors(
      [
        {
          id: 'france',
          name: 'France',
          imageSrc: 'data:image/png;base64,abc123',
          lng: 2.1,
          lat: 46.9,
        },
      ],
      ([lng, lat]) => ({ x: lng * 10, y: lat * 5 }),
      { width: 800, height: 600 },
    );

    expect(anchors[0]).toMatchObject({
      x: 21,
      y: 234.5,
      visible: true,
    });
  });
});

