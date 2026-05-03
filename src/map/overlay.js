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

export function projectAnchors(features, project, viewport) {
  return features.map((feature) => {
    const point = project([feature.lng, feature.lat]);
    const visible =
      point.x >= -120 &&
      point.y >= -120 &&
      point.x <= viewport.width + 120 &&
      point.y <= viewport.height + 120;

    return {
      ...feature,
      x: point.x,
      y: point.y,
      visible,
    };
  });
}

