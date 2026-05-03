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
  desktop: {
    width: 128,
    height: 168,
    gap: 14,
    edge: 12,
    visibilityBuffer: 96,
  },
  tablet: {
    width: 116,
    height: 148,
    gap: 12,
    edge: 10,
    visibilityBuffer: 84,
  },
  mobile: {
    width: 56,
    height: 56,
    gap: 8,
    edge: 6,
    visibilityBuffer: 48,
  },
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

function resolveLayout(viewportMode) {
  if (viewportMode === 'mobile') {
    return FEATURE_CARD_LAYOUT.mobile;
  }

  if (viewportMode === 'tablet') {
    return FEATURE_CARD_LAYOUT.tablet;
  }

  return FEATURE_CARD_LAYOUT.desktop;
}

export function projectAnchors(features, project, viewport, safeInsets = {}, viewportMode = 'desktop') {
  const insets = resolveInsets(safeInsets);
  const layout = resolveLayout(viewportMode);
  const safeWidth = viewport.width;
  const safeHeight = viewport.height;
  const minX = insets.left + layout.edge + layout.width / 2;
  const maxX = safeWidth - insets.right - layout.edge - layout.width / 2;
  const minY = insets.top + layout.edge + layout.height + layout.gap;
  const maxY = safeHeight - insets.bottom - layout.edge + layout.gap;
  const fallbackX = safeWidth / 2;
  const fallbackY = safeHeight / 2;

  return features.map((feature) => {
    const point = project([feature.lng, feature.lat]);
    const visible =
      point.x >= -layout.visibilityBuffer &&
      point.y >= -layout.visibilityBuffer &&
      point.x <= safeWidth + layout.visibilityBuffer &&
      point.y <= safeHeight + layout.visibilityBuffer;

    return {
      ...feature,
      x: clamp(point.x, minX, maxX, fallbackX),
      y: clamp(point.y, minY, maxY, fallbackY),
      visible,
    };
  });
}
