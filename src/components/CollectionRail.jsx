export default function CollectionRail({ collections, activeCollectionId, onSelectCollection }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {collections.map((collection) => {
        const isActive = collection.id === activeCollectionId;

        return (
          <button
            key={collection.id}
            type="button"
            onClick={() => onSelectCollection(collection.id)}
            className={[
              'group rounded-3xl border p-4 text-left transition duration-200',
              'bg-white/5 hover:-translate-y-0.5 hover:bg-white/10',
              isActive ? 'border-cyan-300/60 bg-white/12 shadow-[0_20px_60px_rgba(8,15,28,0.45)]' : 'border-white/10',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg text-white">{collection.title}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-slate-300">{collection.theme}</p>
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-200">
                {collection.batches.length} batches
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{collection.description}</p>
          </button>
        );
      })}
    </div>
  );
}

