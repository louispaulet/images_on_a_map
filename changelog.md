# Changelog

## 2026-05-03

### Legacy freeze

- Preserved the original static Leaflet app as the `v1.0` git tag.
- Documented the legacy behavior: dropdown-driven GeoJSON batches, `properties.name`, base64 PNG images, and direct-open `index.html`.
- Recorded the live domain and the root `CNAME` configuration used by the project.

### V2 rebuild

- Replaced the root experience with a Vite + React + Tailwind + MapLibre app shell.
- Added a large editorial map with anchored image cards projected from the GeoJSON point coordinates.
- Added collection and batch controls for the 12 current content groups and 28 GeoJSON files.
- Added a detail panel for the active feature and the selected batch metadata.

### Map-first UI cleanup

- Removed the long hero copy and replaced it with compact emoji-led stat chips.
- Reserved real header and sidebar space when fitting the map, so anchored faces stay inside the visible viewport.
- Slimmed the floating image cards and the left rail so the map remains the dominant composition.
- Reworked the feature details panel into a denser, more editorial summary with emoji labels.

### Tooling and workflow

- Added `agents.md` with the repo rules: always run `make lint` and `make test`, and always commit and push after each change.
- Added a `Makefile` with `up`, `down`, `lint`, `test`, `build`, and `deploy`.
- Added asset syncing so `geojson_data/` is mirrored into `public/geojson_data/` for dev and production builds.
- Added a GitHub Pages workflow deploy path that publishes the built site and preserves the custom domain.

### Verification

- Ran `make lint`.
- Ran `make test`.
- Ran `make build`.
- Opened the local app in the in-app browser and verified collection switching on the new map UI.
