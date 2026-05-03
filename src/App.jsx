import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { collections, defaultCollectionId, getBatchByFile, getCollectionById } from './data/catalog.js';
import { loadDataset } from './data/loadDataset.js';
import CollectionRail from './components/CollectionRail.jsx';
import BatchRail from './components/BatchRail.jsx';
import FeatureDetails from './components/FeatureDetails.jsx';
import MapScene from './components/MapScene.jsx';

const DEFAULT_CHROME_INSETS = {
  top: 132,
  right: 24,
  bottom: 24,
  left: 344,
};

function measureChromeInsets(headerElement, railElement) {
  if (typeof window === 'undefined') {
    return DEFAULT_CHROME_INSETS;
  }

  const headerHeight = Math.round(headerElement?.getBoundingClientRect().height ?? DEFAULT_CHROME_INSETS.top);
  const railWidth = Math.round(railElement?.getBoundingClientRect().width ?? DEFAULT_CHROME_INSETS.left);

  return {
    top: headerHeight + 20,
    right: DEFAULT_CHROME_INSETS.right,
    bottom: DEFAULT_CHROME_INSETS.bottom,
    left: railWidth + 20,
  };
}

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
  const [chromeInsets, setChromeInsets] = useState(DEFAULT_CHROME_INSETS);
  const headerRef = useRef(null);
  const railRef = useRef(null);

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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let animationFrame = 0;
    const updateChromeInsets = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setChromeInsets(measureChromeInsets(headerRef.current, railRef.current));
      });
    };

    updateChromeInsets();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateChromeInsets);

      return () => {
        window.removeEventListener('resize', updateChromeInsets);
        window.cancelAnimationFrame(animationFrame);
      };
    }

    const observer = new ResizeObserver(updateChromeInsets);

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    if (railRef.current) {
      observer.observe(railRef.current);
    }

    window.addEventListener('resize', updateChromeInsets);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateChromeInsets);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

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
        chromeInsets={chromeInsets}
      />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between gap-3 p-3 lg:p-4">
        <header
          ref={headerRef}
          className="pointer-events-auto max-w-[36rem] rounded-[24px] border border-white/10 bg-slate-950/62 p-4 shadow-glass backdrop-blur-2xl lg:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-[18rem]">
              <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.36em] text-cyan-100/80">
                🧭 V2
              </p>
              <h1 className="mt-3 font-display text-3xl tracking-[-0.05em] text-white md:text-[2.7rem]">
                Images on a map
              </h1>
            </div>

            <div className="flex flex-wrap justify-end gap-2 text-[10px] text-slate-200 sm:max-w-[16rem]">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                🗺️ {collections.length} collections
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                📦 {totalFiles} batches
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                🖼️ {datasetState.features.length} images
              </div>
            </div>
          </div>
        </header>

        <div className="pointer-events-none flex justify-start">
          <aside
            ref={railRef}
            className="pointer-events-auto w-full max-w-[20rem] rounded-[24px] border border-white/10 bg-slate-950/72 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:max-w-[21rem] lg:max-w-[22rem] lg:p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.35em] text-slate-400">🗂️ Collections</p>
                <h2 className="mt-1 font-display text-xl text-white">{activeCollection.title}</h2>
              </div>
              <a
                href="https://github.com/louispaulet/images_on_a_map/tree/v1.0"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.22em] text-slate-200 transition hover:bg-white/10"
              >
                🕰️ v1.0
              </a>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">{activeCollection.description}</p>

            <div className="mt-4">
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
