import { describe, expect, it } from 'vitest';
import { buildCountryRenderModel, lngLatToMercatorPoint } from './countryRenderModel.js';

const square = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
];

function getUvValues(model, offset) {
  const values = [];

  for (let index = offset; index < model.localUvs.length; index += 2) {
    values.push(model.localUvs[index]);
  }

  return values;
}

describe('lngLatToMercatorPoint', () => {
  it('projects lng/lat coordinates into normalized Mercator space', () => {
    expect(lngLatToMercatorPoint([0, 0])).toMatchObject({
      x: 0.5,
      y: 0.5,
    });
  });
});

describe('buildCountryRenderModel', () => {
  it('triangulates a polygon country into renderable triangle vertices', () => {
    const model = buildCountryRenderModel([
      {
        id: 'FR-0',
        iso2: 'FR',
        name: 'France',
        imageSrc: '/country-images/FR.png',
        geometry: {
          type: 'Polygon',
          coordinates: [square],
        },
      },
    ]);

    expect(model.countryCount).toBe(1);
    expect(model.vertexCount).toBe(6);
    expect(model.positions).toHaveLength(12);
    expect(model.localUvs).toHaveLength(12);
    expect(Math.min(...getUvValues(model, 0))).toBe(0);
    expect(Math.max(...getUvValues(model, 0))).toBe(1);
  });

  it('triangulates every polygon in a MultiPolygon country', () => {
    const model = buildCountryRenderModel([
      {
        id: 'ES-0',
        iso2: 'ES',
        name: 'Spain',
        imageSrc: '/country-images/ES.png',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [square],
            [
              [
                [2, 2],
                [3, 2],
                [3, 3],
                [2, 3],
                [2, 2],
              ],
            ],
          ],
        },
      },
    ]);

    expect(model.countryCount).toBe(1);
    expect(model.vertexCount).toBe(12);
    expect(model.countries[0]).toMatchObject({
      iso2: 'ES',
      vertexStart: 0,
      vertexCount: 12,
    });
  });

  it('skips empty geometries', () => {
    const model = buildCountryRenderModel([
      {
        id: 'DE-0',
        iso2: 'DE',
        name: 'Germany',
        imageSrc: '/country-images/DE.png',
        geometry: {
          type: 'Polygon',
          coordinates: [],
        },
      },
    ]);

    expect(model.countryCount).toBe(0);
    expect(model.vertexCount).toBe(0);
  });

  it('skips countries without images', () => {
    const model = buildCountryRenderModel([
      {
        id: 'IT-0',
        iso2: 'IT',
        name: 'Italy',
        imageSrc: '',
        geometry: {
          type: 'Polygon',
          coordinates: [square],
        },
      },
    ]);

    expect(model.countryCount).toBe(0);
    expect(model.vertexCount).toBe(0);
  });
});
