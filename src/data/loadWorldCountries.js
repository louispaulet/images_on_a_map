import { normalizeWorldCountries } from '../map/countryOverlay.js';

export async function loadWorldCountries(signal) {
  const [worldResponse, franceResponse] = await Promise.all([
    fetch('/world-countries.geojson', {
      signal,
    }),
    fetch('/france-metropole.geojson', {
      signal,
    }),
  ]);

  if (!worldResponse.ok) {
    throw new Error(`Failed to load world countries: ${worldResponse.status} ${worldResponse.statusText}`);
  }

  if (!franceResponse.ok) {
    throw new Error(`Failed to load France geometry: ${franceResponse.status} ${franceResponse.statusText}`);
  }

  const [raw, franceGeometry] = await Promise.all([worldResponse.json(), franceResponse.json()]);
  return {
    raw,
    countries: normalizeWorldCountries(raw, 'world-countries.geojson', {
      franceGeometry: franceGeometry.geometry,
    }),
  };
}
