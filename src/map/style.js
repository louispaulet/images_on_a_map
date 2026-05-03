export const editorialStyle = {
  version: 8,
  sources: {
    voyager: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'voyager',
      type: 'raster',
      source: 'voyager',
    },
  ],
};

