export default function BatchRail({ batches, activeBatchFile, onSelectBatch, layoutMode }) {
  const isMobile = layoutMode === 'mobile';

  return (
    <div
      className={[
        'gap-2',
        isMobile
          ? 'flex snap-x snap-mandatory overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex flex-wrap',
      ].join(' ')}
    >
      {batches.map((batch) => {
        const isActive = batch.file === activeBatchFile;
        const label = batch.label.replace(/^Batch\s+/i, '');

        return (
          <button
            key={batch.file}
            type="button"
            onClick={() => onSelectBatch(batch.file)}
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200',
              isMobile ? 'snap-start whitespace-nowrap' : '',
              isActive
                ? 'border-cyan-200 bg-cyan-200 text-slate-950 shadow-[0_10px_24px_rgba(125,211,252,0.35)]'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10',
            ].join(' ')}
            aria-pressed={isActive}
            aria-label={`Select batch ${batch.label}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
