export default function CountryImageOverlay({ countries, viewport }) {
  if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {countries.map((country) => (
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
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        ))}
      </defs>

      {countries.map((country) => (
        <path
          key={country.id}
          d={country.path}
          fill={`url(#country-pattern-${country.iso2})`}
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth={1.15}
          vectorEffect="non-scaling-stroke"
          opacity={1}
        />
      ))}
    </svg>
  );
}
