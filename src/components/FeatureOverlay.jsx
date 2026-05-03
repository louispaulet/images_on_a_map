import { getAnchorPresentation } from '../map/overlay.js';

function getFallbackViewport() {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export default function FeatureOverlay({
  anchors,
  activeFeatureId,
  onSelectFeature,
  collectionTitle,
  batchLabel,
  chromeInsets,
  layoutMode,
  viewport,
}) {
  const visibleAnchors = anchors.slice().sort((left, right) => left.y - right.y);
  const viewportSize = viewport?.width > 0 && viewport?.height > 0 ? viewport : getFallbackViewport();

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {visibleAnchors.map((anchor) => {
        const isActive = anchor.id === activeFeatureId;
        const presentation = getAnchorPresentation(anchor, viewportSize, layoutMode, chromeInsets);
        const detailLevel = isActive ? 'full' : presentation.detailLevel;

        return (
          <button
            key={anchor.id}
            type="button"
            onClick={() => onSelectFeature(anchor.id)}
            className={[
              'pointer-events-auto absolute select-none text-left transition duration-200',
              layoutMode === 'mobile' ? 'w-[6.25rem]' : layoutMode === 'tablet' ? 'w-[7rem]' : 'w-[8rem]',
              'touch-manipulation',
            ].join(' ')}
            style={{
              left: `${anchor.x}px`,
              top: `${anchor.y}px`,
              transform: `translate(-50%, calc(-100% - 0.6rem)) scale(${presentation.scale * (isActive ? 1.06 : 1)})`,
              transformOrigin: 'center bottom',
              opacity: presentation.opacity,
              zIndex: Math.round(anchor.y) + (isActive ? 1000 : 0),
              willChange: 'transform, opacity',
            }}
            aria-label={`Select ${anchor.name}`}
          >
            <div
              className={[
                'relative overflow-hidden border border-white/10 bg-slate-950/82 shadow-[0_16px_34px_rgba(2,6,23,0.42)] backdrop-blur-xl',
                'rounded-[1.25rem]',
                isActive ? 'border-cyan-300/70 shadow-[0_18px_44px_rgba(125,211,252,0.22)]' : '',
              ].join(' ')}
            >
              <div className="overflow-hidden rounded-[1.15rem]">
                <img
                  src={anchor.imageSrc}
                  alt={anchor.name}
                  className={[
                    'w-full object-cover',
                    layoutMode === 'mobile' ? 'h-[4.5rem]' : layoutMode === 'tablet' ? 'h-[4.9rem]' : 'h-[5.4rem]',
                  ].join(' ')}
                  loading="lazy"
                />
              </div>

              {detailLevel === 'full' ? (
                <div className="space-y-0.5 px-2.5 py-2.5">
                  <p className="text-[9px] tracking-[0.26em] text-cyan-100/70">📦 {batchLabel}</p>
                  <p className="text-[0.92rem] font-semibold leading-5 text-white">{anchor.name}</p>
                  <p className="text-[10px] leading-4 text-slate-300">{collectionTitle}</p>
                </div>
              ) : detailLevel === 'compact' ? (
                <div className="space-y-0.5 px-2 py-1.5">
                  <p className="text-[8px] tracking-[0.24em] text-cyan-100/70">📦 {batchLabel}</p>
                  <p className="text-[0.78rem] font-semibold leading-4 text-white">{anchor.name}</p>
                </div>
              ) : null}

              <div
                className={[
                  'absolute inset-x-[34%] -bottom-2 h-3 rounded-full blur-md',
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
