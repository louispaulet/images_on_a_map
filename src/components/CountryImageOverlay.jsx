export default function CountryImageOverlay({ countries, viewport }) {
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const patternedCountries = countries.filter((country) => country.hasImage && country.path);

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {patternedCountries.map((country) => (
          <pattern
            key={country.iso2}
            id={`country-pattern-${country.iso2}`}
            patternUnits="objectBoundingBox"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <image
              href={country.imageSrc}
              x="0"
              y="0"
              width="1"
              height="1"
              preserveAspectRatio="none"
            />
          </pattern>
        ))}
      </defs>

      {countries.map((country) => (
        <path
          key={country.id}
          d={country.path}
          fill={
            country.hasImage ? `url(#country-pattern-${country.iso2})` : 'rgba(148, 163, 184, 0.14)'
          }
          stroke={country.hasImage ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.14)'}
          strokeWidth={country.hasImage ? 1.2 : 0.9}
          vectorEffect="non-scaling-stroke"
          opacity={country.hasImage ? 1 : 0.95}
        />
      ))}
    </svg>
  );
}
