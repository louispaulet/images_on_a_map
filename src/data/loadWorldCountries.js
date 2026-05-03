import { normalizeWorldCountries } from '../map/countryOverlay.js';

export async function loadWorldCountries(signal) {
  const response = await fetch('/world-countries.geojson', {
    signal,
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(`Failed to load world countries: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  return {
    raw,
    countries: normalizeWorldCountries(raw),
  };
}
