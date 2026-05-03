# Images on a Map

Images on a Map is now a modern V2 rebuild of the original static Leaflet experiment. The current app uses Vite, React, Tailwind, and MapLibre to place representative images directly on a large editorial map instead of showing them as plain markers.

## Current Capabilities

- Full-bleed Europe map built with MapLibre
- Anchored image cards projected from GeoJSON point features
- Collection rail for the 12 current content groups
- Batch chips for the 28 GeoJSON files in `geojson_data/`
- Detail panel for the selected place, batch, and coordinates
- Live GitHub Pages deployment at [facemap.thefrenchartist.dev](https://facemap.thefrenchartist.dev/)

The GeoJSON batches are copied into `public/geojson_data/` during `make up` and `make build`, so the app can load the current assets without manual syncing.

## Legacy v1.0

The original release is preserved by the `v1.0` git tag. That version:

- Used a static Leaflet map
- Loaded one GeoJSON batch at a time from the dropdown
- Rendered point features with `properties.name` and a base64 PNG in `properties.image`
- Could be opened directly by loading `index.html` in a browser
- Was the version deployed to the custom domain before this rebuild

## Data Format

Each GeoJSON feature in the current archive follows the same basic pattern:

- `geometry.type = "Point"`
- `geometry.coordinates = [lng, lat]`
- `properties.name`
- `properties.image` as a base64 PNG payload

The notebooks in `notebooks/` remain the source of the current asset set.

## Local Development

```bash
npm install
make up
```

Then open the local URL printed by `make up`.

Other useful targets:

- `make down` stops the local dev server
- `make lint` runs ESLint
- `make test` runs the Vitest smoke tests
- `make build` creates the production bundle
- `make deploy` publishes the built site through the GitHub Pages workflow

## Notes

- The custom domain is tracked in the root `CNAME` file.
- This repo no longer claims an MIT license in the README, because no `LICENSE` file is present here.
