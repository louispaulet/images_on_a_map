function formatCoordinate(value, positiveSuffix, negativeSuffix) {
  const suffix = value >= 0 ? positiveSuffix : negativeSuffix;
  return `${Math.abs(value).toFixed(2)}°${suffix}`;
}

export default function FeatureDetails({ collection, batch, feature, totalFeatures }) {
  if (!feature) {
    return (
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        🖼️ Pick a card on the map to inspect the source image.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/65 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
      <div className="flex items-start gap-3">
        <img
          src={feature.imageSrc}
          alt={feature.name}
          className="h-24 w-[4.5rem] shrink-0 rounded-2xl border border-white/10 object-cover shadow-[0_16px_32px_rgba(2,6,23,0.45)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.35em] text-slate-400">{collection.theme}</p>
          <h3 className="mt-2 font-display text-xl text-white">{feature.name}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-300">
            {collection.title} · {batch.label}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <dt className="text-[10px] tracking-[0.3em] text-slate-400">🗂️ Collection</dt>
          <dd className="mt-2 text-slate-100">{collection.title}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <dt className="text-[10px] tracking-[0.3em] text-slate-400">📦 Batch</dt>
          <dd className="mt-2 text-slate-100">{batch.label}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <dt className="text-[10px] tracking-[0.3em] text-slate-400">📍 Longitude</dt>
          <dd className="mt-2 text-slate-100">{formatCoordinate(feature.lng, 'E', 'W')}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <dt className="text-[10px] tracking-[0.3em] text-slate-400">📐 Latitude</dt>
          <dd className="mt-2 text-slate-100">{formatCoordinate(feature.lat, 'N', 'S')}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[10px] tracking-[0.35em] text-slate-400">
        🖼️ {totalFeatures} anchored images
      </p>
    </div>
  );
}
