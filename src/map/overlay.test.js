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
      x: 67,
      y: 234.5,
      visible: true,
    });
  });

  it('clamps anchors inside the reserved chrome area', () => {
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
      () => ({ x: 12, y: 18 }),
      { width: 800, height: 600 },
      { top: 100, right: 24, bottom: 24, left: 220 },
    );

    expect(anchors[0]).toMatchObject({
      x: 287,
      y: 268,
      visible: true,
    });
  });

  it('uses a tighter anchor layout on mobile screens', () => {
    const viewport = { width: 390, height: 844 };
    const safeInsets = { top: 64, right: 16, bottom: 96, left: 16 };
    const feature = {
      id: 'france',
      name: 'France',
      imageSrc: 'data:image/png;base64,abc123',
      lng: 2.1,
      lat: 46.9,
    };

    const desktopAnchors = projectAnchors([feature], () => ({ x: 80, y: 180 }), viewport, safeInsets, 'desktop');
    const mobileAnchors = projectAnchors([feature], () => ({ x: 80, y: 180 }), viewport, safeInsets, 'mobile');

    expect(desktopAnchors[0]).toMatchObject({
      x: 83,
      y: 232,
    });

    expect(mobileAnchors[0]).toMatchObject({
      x: 80,
      y: 180,
    });
  });

  it('separates overlapping desktop anchors', () => {
    const anchors = projectAnchors(
      [
        {
          id: 'one',
          name: 'One',
          imageSrc: 'data:image/png;base64,abc123',
          lng: 1,
          lat: 1,
        },
        {
          id: 'two',
          name: 'Two',
          imageSrc: 'data:image/png;base64,abc123',
          lng: 1,
          lat: 1,
        },
      ],
      () => ({ x: 220, y: 240 }),
      { width: 800, height: 600 },
      undefined,
      'desktop',
    );

    expect(anchors[0].x === anchors[1].x && anchors[0].y === anchors[1].y).toBe(false);
  });
});
