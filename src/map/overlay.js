export function toImageSrc(image) {
  if (!image) {
    return '';
  }

  return image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
}

export function normalizeFeatureCollection(collection, sourceId) {
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error(`Invalid GeoJSON feature collection in ${sourceId}`);
  }

  return collection.features
    .filter((feature) => feature?.geometry?.type === 'Point')
    .map((feature, index) => {
      const coordinates = feature.geometry.coordinates ?? [];
      const [lng, lat] = coordinates;
      const properties = feature.properties ?? {};

      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(`Invalid coordinates in ${sourceId} at feature ${index}`);
      }

      return {
        id: `${sourceId}-${index}-${properties.name ?? 'feature'}`,
        name: properties.name ?? 'Unnamed place',
        imageSrc: toImageSrc(properties.image ?? ''),
        lng,
        lat,
        raw: feature,
      };
    });
}

export const FEATURE_CARD_LAYOUT = {
  width: 128,
  height: 168,
  gap: 14,
  edge: 12,
  visibilityBuffer: 96,
};

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value) || max < min) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function resolveInsets(safeInsets = {}) {
  return {
    top: safeInsets.top ?? 0,
    right: safeInsets.right ?? 0,
    bottom: safeInsets.bottom ?? 0,
    left: safeInsets.left ?? 0,
  };
}

export function projectAnchors(features, project, viewport, safeInsets = {}) {
  const insets = resolveInsets(safeInsets);
  const safeWidth = viewport.width;
  const safeHeight = viewport.height;
  const minX = insets.left + FEATURE_CARD_LAYOUT.edge + FEATURE_CARD_LAYOUT.width / 2;
  const maxX = safeWidth - insets.right - FEATURE_CARD_LAYOUT.edge - FEATURE_CARD_LAYOUT.width / 2;
  const minY = insets.top + FEATURE_CARD_LAYOUT.edge + FEATURE_CARD_LAYOUT.height + FEATURE_CARD_LAYOUT.gap;
  const maxY = safeHeight - insets.bottom - FEATURE_CARD_LAYOUT.edge + FEATURE_CARD_LAYOUT.gap;
  const fallbackX = safeWidth / 2;
  const fallbackY = safeHeight / 2;

  return features.map((feature) => {
    const point = project([feature.lng, feature.lat]);
    const visible =
      point.x >= -FEATURE_CARD_LAYOUT.visibilityBuffer &&
      point.y >= -FEATURE_CARD_LAYOUT.visibilityBuffer &&
      point.x <= safeWidth + FEATURE_CARD_LAYOUT.visibilityBuffer &&
      point.y <= safeHeight + FEATURE_CARD_LAYOUT.visibilityBuffer;

    return {
      ...feature,
      x: clamp(point.x, minX, maxX, fallbackX),
      y: clamp(point.y, minY, maxY, fallbackY),
      visible,
    };
  });
}
