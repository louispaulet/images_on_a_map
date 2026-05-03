# Images on a Map

This repository started as a small static Leaflet demo that puts representative images on a map. The original experience is now frozen as `v1.0`, and the repo is being rebuilt around a modern Vite + React + Tailwind + MapLibre stack.

## What `v1.0` did

The legacy app:

- Rendered an interactive Europe map with [Leaflet](https://leafletjs.com/)
- Loaded one GeoJSON batch at a time from the `geojson_data/` directory
- Drew each country as a point with a country name and a base64-encoded PNG image
- Used a dropdown to switch between content families and batches
- Could be opened directly by loading `index.html` in a browser

That version is preserved by the `v1.0` git tag.

## Data model

Each GeoJSON feature contains:

- `geometry.type = "Point"`
- `geometry.coordinates = [lng, lat]`
- `properties.name`
- `properties.image` as a base64 PNG payload

The current data sets cover:

- Faces of Europe
- Architecture and typical houses
- Baroque still life prompts
- Impressionist garden prompts
- National leaders
- Mosaic
- Mountain
- Renaissance castle
- Travel poster
- Vintage poster

## Live deployment

The project is currently deployed on GitHub Pages at:

- [https://facemap.thefrenchartist.dev/](https://facemap.thefrenchartist.dev/)

The custom domain is configured through the root `CNAME` file.

## Generating new data

The `notebooks/` directory contains the original notebooks used to create the GeoJSON batches. Those notebooks are still the source of the current assets.

## v2 direction

The next version will keep the current GeoJSON assets, but present them in a more editorial layout:

- Vite for the app shell
- React for state and composition
- Tailwind for the design system
- MapLibre for the map layer
- A dedicated overlay module for image cards anchored to the map

The goal is a large, classy map where the imagery feels integrated into the cartography rather than floating above it.
