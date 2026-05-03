export default function CollectionRail({ collections, activeCollectionId, onSelectCollection, layoutMode }) {
  const isMobile = layoutMode === 'mobile';

  return (
    <div
      className={[
        isMobile
          ? 'flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'grid gap-2 sm:grid-cols-2 lg:grid-cols-1',
      ].join(' ')}
    >
      {collections.map((collection) => {
        const isActive = collection.id === activeCollectionId;

        return (
          <button
            key={collection.id}
            type="button"
            onClick={() => onSelectCollection(collection.id)}
            className={[
              'group rounded-[1.5rem] border text-left transition duration-200',
              isMobile ? 'min-w-[11.5rem] snap-start p-3' : 'p-3',
              'bg-white/5 hover:-translate-y-0.5 hover:bg-white/10',
              isActive ? 'border-cyan-300/60 bg-white/12 shadow-[0_20px_60px_rgba(8,15,28,0.45)]' : 'border-white/10',
            ].join(' ')}
            aria-pressed={isActive}
            aria-label={`Select ${collection.title}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={['font-display text-[1rem] leading-none text-white', isMobile ? 'text-[0.95rem]' : ''].join(' ')}>
                  {collection.title}
                </p>
                <p className="mt-2 text-[10px] tracking-[0.24em] text-slate-300/70">{collection.batches.length} BATCHES</p>
              </div>
              <span
                className={[
                  'shrink-0 rounded-full border px-2.5 py-1 text-[10px] tracking-[0.24em]',
                  isActive ? 'border-cyan-200 bg-cyan-200 text-slate-950' : 'border-white/10 bg-white/5 text-slate-200',
                ].join(' ')}
              >
                {collection.batches.length}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={[
                  'h-full rounded-full transition-all duration-300',
                  isActive ? 'w-full bg-cyan-300' : 'w-1/3 bg-white/30',
                ].join(' ')}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
