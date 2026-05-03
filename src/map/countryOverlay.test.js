import { describe, expect, it } from 'vitest';
import {
  geometryToMetrics,
  geometryToPath,
  normalizeWorldCountries,
  projectCountryFeatures,
  selectCountriesForBatch,
} from './countryOverlay.js';

describe('normalizeWorldCountries', () => {
  it('keeps ISO2 country records and preserves valid geometries', () => {
    const countries = normalizeWorldCountries({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: { name: 'France', 'ISO3166-1-Alpha-2': 'FR' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: { name: 'Nowhere', 'ISO3166-1-Alpha-2': '-99' },
        },
      ],
    });

    expect(countries).toHaveLength(1);
    expect(countries[0]).toMatchObject({
      iso2: 'FR',
      name: 'France',
    });
  });
});

describe('geometryToPath', () => {
  it('projects polygon rings into SVG path data', () => {
    const path = geometryToPath(
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
      ([lng, lat]) => ({ x: lng * 10, y: lat * 10 }),
    );

    expect(path).toBe('M0 0 L20 0 L20 10 L0 10 L0 0 Z');
  });
});

describe('geometryToMetrics', () => {
  it('computes a compactness-aware frame scale', () => {
    const metrics = geometryToMetrics(
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [2, 0],
            [2, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
      ([lng, lat]) => ({ x: lng * 10, y: lat * 10 }),
    );

    expect(metrics.bounds).toMatchObject({
      minX: 0,
      minY: 0,
      maxX: 20,
      maxY: 10,
    });
    expect(metrics.area).toBe(200);
  });
});

describe('projectCountryFeatures', () => {
  it('attaches projected metrics for country fills', () => {
    const countries = projectCountryFeatures(
      [
        {
          id: 'FR-0',
          iso2: 'FR',
          name: 'France',
          imageSrc: '/country-images/FR.png',
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
      () => ({ x: 10, y: 20 }),
      { width: 1200, height: 800 },
    );

    expect(countries[0]).toMatchObject({
      iso2: 'FR',
      imageSrc: '/country-images/FR.png',
      path: '',
      frameScale: 0.82,
    });
  });
});

describe('selectCountriesForBatch', () => {
  it('keeps only countries with a matching batch feature', () => {
    const countries = selectCountriesForBatch(
      [
        { iso2: 'FR', name: 'France', geometry: { type: 'Polygon', coordinates: [] } },
        { iso2: 'ES', name: 'Spain', geometry: { type: 'Polygon', coordinates: [] } },
      ],
      [
        { name: 'France', imageSrc: '/country-images/FR.png' },
        { name: 'Italy', imageSrc: '/country-images/IT.png' },
      ],
    );

    expect(countries).toHaveLength(1);
    expect(countries[0]).toMatchObject({
      iso2: 'FR',
      name: 'France',
      imageSrc: '/country-images/FR.png',
    });
  });
});
