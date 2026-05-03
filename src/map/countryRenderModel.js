import earcut from 'earcut';

const MAX_MERCATOR_LATITUDE = 85.0511287798066;

function clampLatitude(lat) {
  return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, lat));
}

export function lngLatToMercatorPoint([lng, lat]) {
  const clampedLat = clampLatitude(lat);
  const sin = Math.sin((clampedLat * Math.PI) / 180);

  return {
    x: (lng + 180) / 360,
    y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI),
  };
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
  if (!source) {
    return;
  }

  target.minX = Math.min(target.minX, source.minX);
  target.minY = Math.min(target.minY, source.minY);
  target.maxX = Math.max(target.maxX, source.maxX);
  target.maxY = Math.max(target.maxY, source.maxY);
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

function isValidCoordinate(coordinates) {
  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  );
}

function samePoint(left, right) {
  return left.x === right.x && left.y === right.y;
}

function normalizeRing(ring) {
  const points = [];

  for (const coordinates of ring ?? []) {
    if (!isValidCoordinate(coordinates)) {
      continue;
    }

    points.push(lngLatToMercatorPoint(coordinates));
  }

  if (points.length > 1 && samePoint(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points.length >= 3 ? points : [];
}

function getGeometryPolygons(geometry) {
  if (geometry?.type === 'Polygon') {
    return [geometry.coordinates];
  }

  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates ?? [];
  }

  return [];
}

function appendPolygonTriangles(polygon, countryParts) {
  const flat = [];
  const holeIndices = [];
  const points = [];
  const polygonBounds = createBounds();

  for (const ring of polygon ?? []) {
    const normalizedRing = normalizeRing(ring);

    if (normalizedRing.length === 0) {
      continue;
    }

    if (points.length > 0) {
      holeIndices.push(points.length);
    }

    for (const point of normalizedRing) {
      points.push(point);
      flat.push(point.x, point.y);
      extendBounds(polygonBounds, point);
    }
  }

  if (points.length < 3) {
    return;
  }

  const indices = earcut(flat, holeIndices, 2);

  if (indices.length === 0) {
    return;
  }

  countryParts.push({
    bounds: finalizeBounds(polygonBounds),
    indices,
    points,
  });
}

function buildCountryParts(country) {
  const parts = [];
  const polygons = getGeometryPolygons(country.geometry);

  for (const polygon of polygons) {
    appendPolygonTriangles(polygon, parts);
  }

  return parts;
}

function getLocalUv(point, bounds) {
  const width = Math.max(Number.EPSILON, bounds.maxX - bounds.minX);
  const height = Math.max(Number.EPSILON, bounds.maxY - bounds.minY);

  return {
    u: (point.x - bounds.minX) / width,
    v: (point.y - bounds.minY) / height,
  };
}

export function buildCountryRenderModel(countries) {
  const positions = [];
  const localUvs = [];
  const renderCountries = [];
  const modelBounds = createBounds();

  for (const country of countries ?? []) {
    if (!country?.imageSrc) {
      continue;
    }

    const parts = buildCountryParts(country);
    const countryBounds = createBounds();

    for (const part of parts) {
      mergeBounds(countryBounds, part.bounds);
    }

    const bounds = finalizeBounds(countryBounds);
    const vertexStart = positions.length / 2;

    if (!bounds) {
      continue;
    }

    for (const part of parts) {
      for (const index of part.indices) {
        const point = part.points[index];
        const uv = getLocalUv(point, bounds);

        positions.push(point.x, point.y);
        localUvs.push(uv.u, uv.v);
      }
    }

    const vertexCount = positions.length / 2 - vertexStart;

    if (vertexCount === 0) {
      continue;
    }

    mergeBounds(modelBounds, bounds);
    renderCountries.push({
      id: country.id,
      iso2: country.iso2,
      name: country.name,
      imageSrc: country.imageSrc,
      bounds,
      vertexStart,
      vertexCount,
    });
  }

  return {
    bounds: finalizeBounds(modelBounds),
    countries: renderCountries,
    countryCount: renderCountries.length,
    localUvs: new Float32Array(localUvs),
    positions: new Float32Array(positions),
    vertexCount: positions.length / 2,
  };
}
