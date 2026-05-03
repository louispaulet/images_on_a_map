export default function FeatureOverlay({ anchors, activeFeatureId, onSelectFeature, collectionTitle, batchLabel, layoutMode }) {
  const isMobile = layoutMode === 'mobile';
  const visibleAnchors = anchors.slice().sort((left, right) => left.y - right.y);

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
              'pointer-events-auto absolute select-none text-left transition duration-200',
              isMobile ? 'w-[3.25rem]' : 'w-[8rem] sm:w-[8.25rem]',
              anchor.visible ? 'opacity-100' : 'opacity-90',
              isActive ? 'scale-[1.03]' : 'hover:-translate-y-0.5',
            ].join(' ')}
            style={{
              left: `${anchor.x}px`,
              top: `${anchor.y}px`,
              transform: isMobile ? 'translate(-50%, calc(-100% - 0.4rem))' : 'translate(-50%, calc(-100% - 0.875rem))',
              zIndex: Math.round(anchor.y),
            }}
            aria-label={`Select ${anchor.name}`}
          >
            <div
              className={[
                'relative border border-white/10 bg-slate-950/82 shadow-[0_16px_34px_rgba(2,6,23,0.42)] backdrop-blur-xl',
                isMobile ? 'rounded-full p-1' : 'rounded-[1.25rem]',
              ].join(' ')}
            >
              <div className={isMobile ? 'overflow-hidden rounded-full' : 'overflow-hidden rounded-[1.15rem]'}>
                <img
                  src={anchor.imageSrc}
                  alt={anchor.name}
                  className={['object-cover', isMobile ? 'h-[2.75rem] w-[2.75rem] rounded-full' : 'h-[6.75rem] w-full'].join(' ')}
                  loading="lazy"
                />
              </div>
              {!isMobile ? (
                <div className="space-y-0.5 px-2.5 py-2.5">
                  <p className="text-[9px] tracking-[0.26em] text-cyan-100/70">📦 {batchLabel}</p>
                  <p className="text-[0.95rem] font-semibold leading-5 text-white">{anchor.name}</p>
                  <p className="text-[10px] leading-4 text-slate-300">{collectionTitle}</p>
                </div>
              ) : null}
              <div
                className={[
                  'absolute inset-x-[34%] -bottom-2 h-3 rounded-full blur-md',
                  isActive ? 'bg-cyan-300/60' : 'bg-black/50',
                  isMobile ? 'inset-x-[18%] -bottom-1 h-2' : '',
                ].join(' ')}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
