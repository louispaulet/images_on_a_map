export const COUNTRY_IMAGES = [
  { iso2: 'FR', name: 'France', imageSrc: '/country-images/FR.png' },
  { iso2: 'SE', name: 'Sweden', imageSrc: '/country-images/SE.png' },
  { iso2: 'PL', name: 'Poland', imageSrc: '/country-images/PL.png' },
  { iso2: 'AT', name: 'Austria', imageSrc: '/country-images/AT.png' },
  { iso2: 'HU', name: 'Hungary', imageSrc: '/country-images/HU.png' },
  { iso2: 'RO', name: 'Romania', imageSrc: '/country-images/RO.png' },
  { iso2: 'LT', name: 'Lithuania', imageSrc: '/country-images/LT.png' },
  { iso2: 'LV', name: 'Latvia', imageSrc: '/country-images/LV.png' },
  { iso2: 'EE', name: 'Estonia', imageSrc: '/country-images/EE.png' },
  { iso2: 'DE', name: 'Germany', imageSrc: '/country-images/DE.png' },
  { iso2: 'BG', name: 'Bulgaria', imageSrc: '/country-images/BG.png' },
  { iso2: 'GR', name: 'Greece', imageSrc: '/country-images/GR.png' },
  { iso2: 'HR', name: 'Croatia', imageSrc: '/country-images/HR.png' },
  { iso2: 'BE', name: 'Belgium', imageSrc: '/country-images/BE.png' },
  { iso2: 'NL', name: 'Netherlands', imageSrc: '/country-images/NL.png' },
  { iso2: 'PT', name: 'Portugal', imageSrc: '/country-images/PT.png' },
  { iso2: 'ES', name: 'Spain', imageSrc: '/country-images/ES.png' },
  { iso2: 'IE', name: 'Ireland', imageSrc: '/country-images/IE.png' },
  { iso2: 'IT', name: 'Italy', imageSrc: '/country-images/IT.png' },
  { iso2: 'DK', name: 'Denmark', imageSrc: '/country-images/DK.png' },
  { iso2: 'SI', name: 'Slovenia', imageSrc: '/country-images/SI.png' },
  { iso2: 'FI', name: 'Finland', imageSrc: '/country-images/FI.png' },
  { iso2: 'SK', name: 'Slovakia', imageSrc: '/country-images/SK.png' },
];

export const countryImageByIso2 = Object.fromEntries(
  COUNTRY_IMAGES.map((country) => [country.iso2, country]),
);

export function getCountryImage(iso2) {
  if (typeof iso2 !== 'string') {
    return null;
  }

  return countryImageByIso2[iso2.trim().toUpperCase()] ?? null;
}
