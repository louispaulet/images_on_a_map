export default function BatchRail({ batches, activeBatchFile, onSelectBatch }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Batches</p>
        <p className="text-xs text-slate-400">{batches.length} available</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {batches.map((batch) => {
          const isActive = batch.file === activeBatchFile;

          return (
            <button
              key={batch.file}
              type="button"
              onClick={() => onSelectBatch(batch.file)}
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200',
                isActive
                  ? 'border-cyan-200 bg-cyan-200 text-slate-950 shadow-[0_10px_24px_rgba(125,211,252,0.35)]'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
              ].join(' ')}
            >
              {batch.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

