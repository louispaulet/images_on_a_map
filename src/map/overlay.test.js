import { describe, expect, it } from 'vitest';
import { getAnchorPresentation, normalizeFeatureCollection, projectAnchors } from './overlay.js';
import { collections } from '../data/catalog.js';

describe('catalog', () => {
  it('keeps the original 12 content groups and 31 batch files', () => {
    const batchCount = collections.reduce((total, collection) => total + collection.batches.length, 0);

    expect(collections).toHaveLength(12);
    expect(batchCount).toBe(31);
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

  it('preserves external image urls', () => {
    const features = normalizeFeatureCollection(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.0992, 46.895] },
            properties: { name: 'France', image: '/geojson_images/sample-batch/001-france.webp' },
          },
        ],
      },
      'sample-batch.geojson',
    );

    expect(features[0].imageSrc).toBe('/geojson_images/sample-batch/001-france.webp');
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

  it('scales cards from full size at the center to tiny at the edge', () => {
    const viewport = { width: 1200, height: 800 };
    const center = getAnchorPresentation({ x: 600, y: 400 }, viewport, 'desktop');
    const edge = getAnchorPresentation({ x: 40, y: 40 }, viewport, 'desktop');

    expect(center.detailLevel).toBe('full');
    expect(center.scale).toBe(1);
    expect(edge.detailLevel).toBe('mini');
    expect(edge.scale).toBe(0.05);
  });
});
