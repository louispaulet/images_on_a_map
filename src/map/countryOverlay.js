import { getCountryImage } from '../data/countryImageMap.js';

function assertFeatureCollection(collection, sourceId) {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON feature collection in ${sourceId}`);
  }
}

function formatPoint(value) {
  return Math.round(value * 10) / 10;
}

function ringToPath(ring, project) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return '';
  }

  return ring
    .map((coordinates, index) => {
      const point = project(coordinates);
      const command = index === 0 ? 'M' : 'L';
      return `${command}${formatPoint(point.x)} ${formatPoint(point.y)}`;
    })
    .join(' ') + ' Z';
}

function polygonToPath(coordinates, project) {
  return coordinates.map((ring) => ringToPath(ring, project)).filter(Boolean).join(' ');
}

export function geometryToPath(geometry, project) {
  if (!geometry) {
    return '';
  }

  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates, project);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygonToPath(polygon, project)).filter(Boolean).join(' ');
  }

  return '';
}

export function normalizeWorldCountries(collection, sourceId = 'world-countries.geojson') {
  assertFeatureCollection(collection, sourceId);

  return collection.features
    .map((feature, index) => {
      const properties = feature?.properties ?? {};
      const iso2 = String(properties['ISO3166-1-Alpha-2'] ?? '').trim().toUpperCase();

      if (iso2.length !== 2 || iso2 === '-99') {
        return null;
      }

      return {
        id: `${iso2}-${index}`,
        iso2,
        name: properties.name ?? iso2,
        geometry: feature.geometry,
        raw: feature,
      };
    })
    .filter(Boolean);
}

export function projectCountryFeatures(countries, project, viewport) {
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return [];
  }

  return countries.map((country) => {
    const image = getCountryImage(country.iso2);
    return {
      ...country,
      imageSrc: image?.imageSrc ?? '',
      hasImage: Boolean(image),
      path: geometryToPath(country.geometry, project),
    };
  });
}
