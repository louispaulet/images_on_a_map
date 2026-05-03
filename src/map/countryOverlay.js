const COUNTRY_OVERRIDES = {
  France: 'FR',
};

function normalizeCountryName(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createBounds() {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
}

function extendBounds(bounds, point) {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function mergeBounds(target, source) {
  if (!source || source.minX === Number.POSITIVE_INFINITY) {
    return target;
  }

  target.minX = Math.min(target.minX, source.minX);
  target.minY = Math.min(target.minY, source.minY);
  target.maxX = Math.max(target.maxX, source.maxX);
  target.maxY = Math.max(target.maxY, source.maxY);
  return target;
}

function finalizeBounds(bounds) {
  if (
    bounds.minX === Number.POSITIVE_INFINITY ||
    bounds.minY === Number.POSITIVE_INFINITY ||
    bounds.maxX === Number.NEGATIVE_INFINITY ||
    bounds.maxY === Number.NEGATIVE_INFINITY
  ) {
    return null;
  }

  return bounds;
}

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

function ringToMetrics(ring, project) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return null;
  }

  const bounds = createBounds();
  const points = [];

  for (const coordinates of ring) {
    const point = project(coordinates);

    if (
      !point ||
      typeof point.x !== 'number' ||
      typeof point.y !== 'number' ||
      Number.isNaN(point.x) ||
      Number.isNaN(point.y)
    ) {
      continue;
    }

    points.push(point);
    extendBounds(bounds, point);
  }

  if (points.length === 0) {
    return null;
  }

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return {
    path: ringToPath(ring, project),
    bounds,
    area: Math.abs(area) / 2,
  };
}

function polygonToMetrics(coordinates, project) {
  const bounds = createBounds();
  let path = '';
  let area = 0;

  for (const ring of coordinates) {
    const metrics = ringToMetrics(ring, project);

    if (!metrics) {
      continue;
    }

    path = `${path}${path ? ' ' : ''}${metrics.path}`.trim();
    mergeBounds(bounds, metrics.bounds);
    area += metrics.area;
  }

  return {
    path,
    bounds: finalizeBounds(bounds),
    area,
  };
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

export function geometryToMetrics(geometry, project) {
  if (!geometry) {
    return {
      path: '',
      bounds: null,
      area: 0,
    };
  }

  if (geometry.type === 'Polygon') {
    return polygonToMetrics(geometry.coordinates, project);
  }

  if (geometry.type === 'MultiPolygon') {
    const bounds = createBounds();
    let path = '';
    let area = 0;

    for (const polygon of geometry.coordinates) {
      const metrics = polygonToMetrics(polygon, project);

      if (!metrics) {
        continue;
      }

      path = `${path}${path ? ' ' : ''}${metrics.path}`.trim();
      mergeBounds(bounds, metrics.bounds);
      area += metrics.area;
    }

    return {
      path,
      bounds: finalizeBounds(bounds),
      area,
    };
  }

  return {
    path: '',
    bounds: null,
    area: 0,
  };
}

export function normalizeWorldCountries(
  collection,
  sourceId = 'world-countries.geojson',
  options = {},
) {
  assertFeatureCollection(collection, sourceId);

  return collection.features
    .map((feature, index) => {
      const properties = feature?.properties ?? {};
      const name = String(properties.name ?? '').trim();
      const iso2 = String(COUNTRY_OVERRIDES[name] ?? properties['ISO3166-1-Alpha-2'] ?? '')
        .trim()
        .toUpperCase();

      if (iso2.length !== 2 || iso2 === '-99') {
        return null;
      }

      const geometry = iso2 === 'FR' && options.franceGeometry ? options.franceGeometry : feature.geometry;

      return {
        id: `${iso2}-${index}`,
        iso2,
        name: name || iso2,
        geometry,
        raw: feature,
      };
    })
    .filter(Boolean);
}

export function selectCountriesForBatch(worldCountries, batchFeatures) {
  if (!Array.isArray(worldCountries) || !Array.isArray(batchFeatures) || batchFeatures.length === 0) {
    return [];
  }

  const worldByIso2 = new Map();
  const worldByName = new Map();

  for (const country of worldCountries) {
    if (!country?.iso2) {
      continue;
    }

    worldByIso2.set(country.iso2, country);
    worldByName.set(normalizeCountryName(country.name), country);
  }

  const selected = [];
  const seenIso2 = new Set();

  for (const feature of batchFeatures) {
    const featureName = String(feature?.name ?? '').trim();
    const featureIso2 = String(
      feature?.iso2 ??
        feature?.countryCode ??
        feature?.country ??
        feature?.properties?.iso2 ??
        feature?.properties?.ISO3166_1_Alpha_2 ??
        '',
    )
      .trim()
      .toUpperCase();

    const worldCountry =
      (featureIso2 ? worldByIso2.get(featureIso2) : null) ??
      worldByName.get(normalizeCountryName(featureName));

    if (!worldCountry || seenIso2.has(worldCountry.iso2) || !feature?.imageSrc) {
      continue;
    }

    seenIso2.add(worldCountry.iso2);
    selected.push({
      id: `${worldCountry.iso2}-${selected.length}`,
      iso2: worldCountry.iso2,
      name: worldCountry.name,
      imageSrc: feature.imageSrc,
      geometry: worldCountry.geometry,
      batchName: featureName,
      raw: feature,
    });
  }

  return selected;
}

export function projectCountryFeatures(countries, project, viewport) {
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return [];
  }

  return countries.map((country) => {
    const metrics = geometryToMetrics(country.geometry, project);
    const bounds = metrics.bounds;
    const bboxArea = bounds
      ? Math.max(1, (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY))
      : 1;
    const compactness = bounds ? Math.max(0, Math.min(1, metrics.area / bboxArea)) : 0;

    return {
      ...country,
      path: metrics.path,
      bounds,
      compactness,
      frameScale: bounds ? Math.max(0.68, Math.min(0.9, 0.68 + Math.sqrt(compactness) * 0.12)) : 0.82,
    };
  });
}
