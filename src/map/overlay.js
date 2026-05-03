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

function getCardBounds(anchor, layout) {
  const left = anchor.x - layout.width / 2;
  const top = anchor.y - layout.height - layout.gap;

  return {
    left,
    top,
    right: left + layout.width,
    bottom: top + layout.height,
  };
}

function intersects(leftRect, rightRect, padding = 12) {
  return !(
    leftRect.right + padding <= rightRect.left ||
    leftRect.left - padding >= rightRect.right ||
    leftRect.bottom + padding <= rightRect.top ||
    leftRect.top - padding >= rightRect.bottom
  );
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

function resolveAnchorCollisions(anchors, layout, viewport, insets) {
  const spacingX = Math.max(18, layout.width * 0.58);
  const spacingY = Math.max(16, layout.height * 0.34);
  const candidateOffsets = [[0, 0]];

  for (let ring = 1; ring <= 8; ring += 1) {
    const dx = spacingX * ring;
    const dy = spacingY * ring;

    candidateOffsets.push(
      [dx, 0],
      [-dx, 0],
      [0, dy],
      [0, -dy],
      [dx, dy * 0.7],
      [-dx, dy * 0.7],
      [dx, -dy * 0.7],
      [-dx, -dy * 0.7],
    );
  }

  const placed = [];

  return anchors.map((anchor) => {
    const point = { x: anchor.x, y: anchor.y };

    for (const [dx, dy] of candidateOffsets) {
      const candidatePoint = clampAnchorPoint(point.x + dx, point.y + dy, layout, insets, viewport.width, viewport.height);
      const candidate = {
        ...anchor,
        x: candidatePoint.x,
        y: candidatePoint.y,
      };
      const candidateBounds = getCardBounds(candidate, layout);

      if (candidateBounds.left < insets.left || candidateBounds.right > viewport.width - insets.right) {
        continue;
      }

      if (candidateBounds.top < insets.top || candidateBounds.bottom > viewport.height - insets.bottom) {
        continue;
      }

      if (placed.every((existing) => !intersects(candidateBounds, existing.bounds))) {
        placed.push({
          bounds: candidateBounds,
          x: candidate.x,
          y: candidate.y,
        });

        return candidate;
      }
    }

    const fallbackPoint = clampAnchorPoint(point.x, point.y, layout, insets, viewport.width, viewport.height);
    const fallback = {
      ...anchor,
      x: fallbackPoint.x,
      y: fallbackPoint.y,
    };
    placed.push({
      bounds: getCardBounds(fallback, layout),
      x: fallback.x,
      y: fallback.y,
    });

    return fallback;
  });
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

  if (viewportMode === 'mobile') {
    return projected.map((anchor) => {
      const clamped = clampAnchorPoint(anchor.x, anchor.y, layout, insets, safeWidth, safeHeight);

      return {
        ...anchor,
        x: clamped.x,
        y: clamped.y,
      };
    });
  }

  const sorted = projected.slice().sort((left, right) => left.y - right.y || left.x - right.x);
  return resolveAnchorCollisions(sorted, layout, viewport, insets);
}
