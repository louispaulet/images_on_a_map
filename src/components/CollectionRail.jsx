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
              'group rounded-2xl border text-left transition duration-200',
              isMobile ? 'min-w-[11.5rem] snap-start p-2.5' : 'p-3',
              'bg-white/5 hover:-translate-y-0.5 hover:bg-white/10',
              isActive ? 'border-cyan-300/60 bg-white/12 shadow-[0_20px_60px_rgba(8,15,28,0.45)]' : 'border-white/10',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={['font-display text-base text-white', isMobile ? 'text-[0.95rem]' : ''].join(' ')}>
                  {collection.title}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.3em] text-slate-300/80">{collection.theme}</p>
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] tracking-[0.25em] text-slate-200">
                📦 {collection.batches.length}
              </span>
            </div>
            <p className={['mt-2 text-sm leading-5 text-slate-300', isMobile ? 'max-h-16 overflow-hidden' : ''].join(' ')}>
              {collection.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
