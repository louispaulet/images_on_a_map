export function toImageSrc(image) {
  if (!image) {
    return '';
  }

  if (typeof image !== 'string') {
    return '';
  }

  const trimmed = image.trim();

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
  ) {
    return trimmed;
  }

  return `data:image/png;base64,${trimmed}`;
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
      const iso2 = String(
        properties.iso2 ??
          properties.ISO2 ??
          properties['ISO3166-1-Alpha-2'] ??
          properties.countryCode ??
          '',
      )
        .trim()
        .toUpperCase();

      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error(`Invalid coordinates in ${sourceId} at feature ${index}`);
      }

      return {
        id: `${sourceId}-${index}-${properties.name ?? 'feature'}`,
        name: properties.name ?? 'Unnamed place',
        iso2,
        imageSrc: toImageSrc(properties.image ?? ''),
        lng,
        lat,
        raw: feature,
      };
    });
}

export const FEATURE_CARD_LAYOUT = {
  desktop: {
    width: 114,
    height: 146,
    gap: 12,
    edge: 10,
    visibilityBuffer: 84,
  },
  tablet: {
    width: 102,
    height: 134,
    gap: 10,
    edge: 8,
    visibilityBuffer: 72,
  },
  mobile: {
    width: 56,
    height: 56,
    gap: 8,
    edge: 6,
    visibilityBuffer: 48,
  },
};

const FOCUS_LAYOUT = {
  desktop: {
    innerRadiusRatio: 0.24,
    outerRadiusRatio: 0.5,
    falloff: 4.6,
  },
  tablet: {
    innerRadiusRatio: 0.22,
    outerRadiusRatio: 0.48,
    falloff: 4.7,
  },
  mobile: {
    innerRadiusRatio: 0.18,
    outerRadiusRatio: 0.46,
    falloff: 4.9,
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

function resolveFocusLayout(viewportMode) {
  if (viewportMode === 'mobile') {
    return FOCUS_LAYOUT.mobile;
  }

  if (viewportMode === 'tablet') {
    return FOCUS_LAYOUT.tablet;
  }

  return FOCUS_LAYOUT.desktop;
}

function clampAnchorPoint(x, y, layout, insets, safeWidth, safeHeight) {
  const minX = insets.left + layout.edge + layout.width / 2;
  const maxX = safeWidth - insets.right - layout.edge - layout.width / 2;
  const minY = insets.top + layout.edge + layout.height + layout.gap;
  const maxY = safeHeight - insets.bottom - layout.edge + layout.gap;

  return {
    x: clamp(x, minX, maxX, safeWidth / 2),
    y: clamp(y, minY, maxY, safeHeight / 2),
  };
}

export function projectAnchors(features, project, viewport, safeInsets = {}, viewportMode = 'desktop') {
  const insets = resolveInsets(safeInsets);
  const layout = resolveLayout(viewportMode);
  const safeWidth = viewport.width;
  const safeHeight = viewport.height;

  const projected = features.map((feature) => {
    const point = project([feature.lng, feature.lat]);
    const visible =
      point.x >= -layout.visibilityBuffer &&
      point.y >= -layout.visibilityBuffer &&
      point.x <= safeWidth + layout.visibilityBuffer &&
      point.y <= safeHeight + layout.visibilityBuffer;

    return {
      ...feature,
      x: point.x,
      y: point.y,
      visible,
    };
  });
  return projected.map((anchor) => {
    const clamped = clampAnchorPoint(anchor.x, anchor.y, layout, insets, safeWidth, safeHeight);

    return {
      ...anchor,
      x: clamped.x,
      y: clamped.y,
    };
  });
}

export function getAnchorPresentation(anchor, viewport, viewportMode = 'desktop', chromeInsets = {}) {
  const focus = resolveFocusLayout(viewportMode);
  const safeWidth = viewport?.width ?? 0;
  const safeHeight = viewport?.height ?? 0;
  const centerX = Math.min(
    safeWidth - 48,
    (safeWidth + (chromeInsets.left ?? 0)) / 2,
  );
  const centerY = Math.min(
    safeHeight - 48,
    (safeHeight + (chromeInsets.top ?? 0) - (chromeInsets.bottom ?? 0)) / 2,
  );
  const minDimension = Math.min(safeWidth, safeHeight);
  const innerRadius = minDimension * focus.innerRadiusRatio;
  const outerRadius = minDimension * focus.outerRadiusRatio;
  const distance = Math.hypot(anchor.x - centerX, anchor.y - centerY);
  const normalizedDistance = clamp((distance - innerRadius) / Math.max(1, outerRadius - innerRadius), 0, 1, 1);
  const scale = distance <= innerRadius ? 1 : Math.max(0.05, Math.exp(-focus.falloff * normalizedDistance));
  const opacity = Math.max(0.2, 0.15 + scale * 0.85);
  const detailLevel = scale >= 0.8 ? 'full' : scale >= 0.28 ? 'compact' : 'mini';

  return {
    detailLevel,
    opacity,
    scale,
  };
}
