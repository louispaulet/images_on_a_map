export default function FeatureOverlay({ anchors, activeFeatureId, onSelectFeature, collectionTitle, batchLabel }) {
  const visibleAnchors = anchors
    .filter((anchor) => anchor.visible)
    .slice()
    .sort((left, right) => left.y - right.y);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {visibleAnchors.map((anchor) => {
        const isActive = anchor.id === activeFeatureId;

        return (
          <button
            key={anchor.id}
            type="button"
            onClick={() => onSelectFeature(anchor.id)}
            className={[
              'pointer-events-auto absolute w-[9.5rem] select-none text-left transition duration-200',
              isActive ? 'scale-[1.02]' : 'hover:-translate-y-1',
            ].join(' ')}
            style={{
              left: `${anchor.x}px`,
              top: `${anchor.y}px`,
              transform: 'translate(-50%, calc(-100% - 0.85rem))',
              zIndex: Math.round(anchor.y),
            }}
            aria-label={`Select ${anchor.name}`}
          >
            <div className="relative rounded-[1.5rem] border border-white/10 bg-slate-950/80 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[1.35rem]">
                <img
                  src={anchor.imageSrc}
                  alt={anchor.name}
                  className="h-[8.75rem] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-100/70">{batchLabel}</p>
                <p className="text-sm font-semibold text-white">{anchor.name}</p>
                <p className="text-[11px] leading-5 text-slate-300">{collectionTitle}</p>
              </div>
              <div
                className={[
                  'absolute inset-x-[36%] -bottom-2 h-4 rounded-full blur-md',
                  isActive ? 'bg-cyan-300/60' : 'bg-black/50',
                ].join(' ')}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

