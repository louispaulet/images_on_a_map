import { useEffect, useState } from 'react';
import { collections, defaultCollectionId, getBatchByFile, getCollectionById } from './data/catalog.js';
import { loadDataset } from './data/loadDataset.js';
import CollectionRail from './components/CollectionRail.jsx';
import BatchRail from './components/BatchRail.jsx';
import FeatureDetails from './components/FeatureDetails.jsx';
import MapScene from './components/MapScene.jsx';

export default function App() {
  const [collectionId, setCollectionId] = useState(defaultCollectionId);
  const activeCollection = getCollectionById(collectionId);
  const [batchFile, setBatchFile] = useState(activeCollection.batches[0].file);
  const activeBatch = getBatchByFile(activeCollection, batchFile);
  const [datasetState, setDatasetState] = useState({
    status: 'loading',
    features: [],
    error: null,
  });
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setDatasetState({
      status: 'loading',
      features: [],
      error: null,
    });

    loadDataset(activeBatch.file, controller.signal)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setDatasetState({
          status: 'ready',
          features: result.features,
          error: null,
        });
        setSelectedFeatureId(result.features[0]?.id ?? null);
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        setDatasetState({
          status: 'error',
          features: [],
          error,
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeBatch.file]);

  const selectedFeature =
    datasetState.features.find((feature) => feature.id === selectedFeatureId) ?? datasetState.features[0] ?? null;
  const totalFiles = collections.reduce((sum, collection) => sum + collection.batches.length, 0);

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_30%),linear-gradient(180deg,#07101c_0%,#050814_52%,#03050a_100%)]" />
      <MapScene
        features={datasetState.features}
        activeFeatureId={selectedFeatureId}
        onSelectFeature={setSelectedFeatureId}
        collectionTitle={activeCollection.title}
        batchLabel={activeBatch.label}
      />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between gap-4 p-4 lg:p-6">
        <header className="pointer-events-auto max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/65 p-5 shadow-glass backdrop-blur-2xl lg:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-cyan-100/80">
                V2 scaffold
              </p>
              <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] text-white md:text-5xl">
                Representative images, anchored to a map that feels editorial.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                This rebuild keeps the original GeoJSON batches, but presents them as a larger, more integrated
                cartographic composition with React, Tailwind, and MapLibre.
              </p>
            </div>

            <div className="grid min-w-[12rem] gap-2 text-xs text-slate-300 md:text-right">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {collections.length} collections
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {totalFiles} GeoJSON batches
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                {datasetState.features.length} anchored images
              </div>
            </div>
          </div>
        </header>

        <div className="pointer-events-none flex justify-start">
          <aside className="pointer-events-auto w-full max-w-[34rem] rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Collections</p>
                <h2 className="mt-1 font-display text-2xl text-white">{activeCollection.title}</h2>
              </div>
              <a
                href="https://github.com/louispaulet/images_on_a_map/tree/v1.0"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
              >
                Legacy v1.0
              </a>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {activeCollection.description}
            </p>

            <div className="mt-5">
              <CollectionRail
                collections={collections}
                activeCollectionId={collectionId}
                onSelectCollection={setCollectionId}
              />
            </div>

            <BatchRail
              batches={activeCollection.batches}
              activeBatchFile={activeBatch.file}
              onSelectBatch={setBatchFile}
            />

            {datasetState.status === 'error' ? (
              <div className="mt-4 rounded-3xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                {datasetState.error?.message ?? 'Unable to load the selected batch.'}
              </div>
            ) : null}

            {datasetState.status === 'loading' ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Loading anchored images from the selected GeoJSON batch...
              </div>
            ) : (
              <FeatureDetails
                collection={activeCollection}
                batch={activeBatch}
                feature={selectedFeature}
                totalFeatures={datasetState.features.length}
              />
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
