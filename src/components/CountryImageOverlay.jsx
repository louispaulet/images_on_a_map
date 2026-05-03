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
          <clipPath key={`clip-${country.id}`} id={`country-clip-${country.id}`}>
            <path d={country.path} />
          </clipPath>
        ))}
        {countries.map((country) => {
          const frameScale = country.frameScale ?? 0.88;
          const inset = (1 - frameScale) / 2;

          return (
            <pattern
              key={`pattern-${country.id}`}
              id={`country-pattern-${country.id}`}
              patternUnits="objectBoundingBox"
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={country.imageSrc}
                x={inset}
                y={inset}
                width={frameScale}
                height={frameScale}
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          );
        })}
      </defs>

      {countries.map((country) => (
        <g key={country.id}>
          <path
            d={country.path}
            fill="rgba(15, 23, 42, 0.52)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth={1.1}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={country.path}
            fill={`url(#country-pattern-${country.id})`}
            clipPath={`url(#country-clip-${country.id})`}
            opacity={1}
          />
        </g>
      ))}
    </svg>
  );
}
