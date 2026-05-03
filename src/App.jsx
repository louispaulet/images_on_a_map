import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { collections, defaultCollectionId, getBatchByFile, getCollectionById } from './data/catalog.js';
import { loadDataset } from './data/loadDataset.js';
import CollectionRail from './components/CollectionRail.jsx';
import BatchRail from './components/BatchRail.jsx';
import FeatureDetails from './components/FeatureDetails.jsx';
import MapScene from './components/MapScene.jsx';

const VIEWPORT_BREAKPOINTS = {
  mobile: 768,
  desktop: 1200,
};

const DEFAULT_CHROME_INSETS = {
  top: 120,
  right: 24,
  bottom: 24,
  left: 304,
};

function getViewportMode(width = typeof window !== 'undefined' ? window.innerWidth : VIEWPORT_BREAKPOINTS.desktop) {
  if (width < VIEWPORT_BREAKPOINTS.mobile) {
    return 'mobile';
  }

  if (width < VIEWPORT_BREAKPOINTS.desktop) {
    return 'tablet';
  }

  return 'desktop';
}

function measureChromeInsets(headerElement, railElement, viewportMode) {
  if (typeof window === 'undefined') {
    return DEFAULT_CHROME_INSETS;
  }

  const headerHeight = Math.round(headerElement?.getBoundingClientRect().height ?? DEFAULT_CHROME_INSETS.top);
  const railRect = railElement?.getBoundingClientRect();

  if (viewportMode === 'mobile') {
    const railHeight = Math.round(railRect?.height ?? 88);

    return {
      top: headerHeight + 16,
      right: 16,
      bottom: railHeight + 16,
      left: 16,
    };
  }

  return {
    top: headerHeight + 20,
    right: DEFAULT_CHROME_INSETS.right,
    bottom: DEFAULT_CHROME_INSETS.bottom,
    left: Math.round(railRect?.width ?? DEFAULT_CHROME_INSETS.left) + 20,
  };
}

function HeaderChrome({ featureCount, totalFiles, totalCollections }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-[18rem]">
        <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.36em] text-cyan-100/80">
          🧭 V2
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-[0.95] tracking-[-0.05em] text-white sm:text-[2.6rem]">
          Images on a map
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-200">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center">
          🗺️ {totalCollections}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center">
          📦 {totalFiles}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-center">
          🖼️ {featureCount}
        </div>
      </div>
    </div>
  );
}

function ControlsChrome({
  activeCollection,
  activeBatch,
  collectionId,
  collections,
  datasetState,
  isMobile,
  layoutMode,
  onSelectBatch,
  onSelectCollection,
  onToggleControls,
  selectedFeature,
  showBody,
  totalFiles,
  controlsOpen,
}) {
  return (
    <>
      {isMobile ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.35em] text-slate-400">🗂️ Collections</p>
            <h2 className="mt-1 truncate font-display text-xl text-white">{activeCollection.title}</h2>
            <p className="mt-1 truncate text-xs text-slate-300">
              {activeBatch.label}
              {selectedFeature ? ` · ${selectedFeature.name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleControls}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] tracking-[0.22em] text-slate-200 transition hover:bg-white/10"
          >
            {controlsOpen ? 'Collapse' : 'Open'}
          </button>
        </div>
      ) : (
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
      )}

      {showBody ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm leading-6 text-slate-300">{activeCollection.description}</p>

          <CollectionRail
            collections={collections}
            activeCollectionId={collectionId}
            onSelectCollection={onSelectCollection}
            layoutMode={layoutMode}
          />

          <BatchRail
            batches={activeCollection.batches}
            activeBatchFile={activeBatch.file}
            onSelectBatch={onSelectBatch}
            layoutMode={layoutMode}
          />

          {datasetState.status === 'error' ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {datasetState.error?.message ?? 'Unable to load the selected batch.'}
            </div>
          ) : null}

          {datasetState.status === 'loading' ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Loading anchored images from the selected GeoJSON batch...
            </div>
          ) : (
            <FeatureDetails
              collection={activeCollection}
              batch={activeBatch}
              feature={selectedFeature}
              totalFeatures={datasetState.features.length}
              layoutMode={layoutMode}
            />
          )}

          {!isMobile ? (
            <p className="text-[10px] tracking-[0.35em] text-slate-400">
              🖼️ {datasetState.features.length} anchored images · {totalFiles} batches
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-[10px] tracking-[0.28em] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            🗺️ {collections.length} collections
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
            📦 {activeCollection.batches.length} batches
          </span>
        </div>
      )}
    </>
  );
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
  const [layoutMode, setLayoutMode] = useState(() => getViewportMode());
  const [controlsOpen, setControlsOpen] = useState(() => getViewportMode() !== 'mobile');
  const headerRef = useRef(null);
  const railRef = useRef(null);

  useEffect(() => {
    const updateLayoutMode = () => {
      setLayoutMode(getViewportMode());
    };

    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);

    return () => {
      window.removeEventListener('resize', updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    setControlsOpen(layoutMode !== 'mobile');
  }, [layoutMode]);

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
        setChromeInsets(measureChromeInsets(headerRef.current, railRef.current, layoutMode));
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
  }, [controlsOpen, layoutMode]);

  const selectedFeature =
    datasetState.features.find((feature) => feature.id === selectedFeatureId) ?? datasetState.features[0] ?? null;
  const totalFiles = collections.reduce((sum, collection) => sum + collection.batches.length, 0);
  const isMobile = layoutMode === 'mobile';

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
        layoutMode={layoutMode}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="flex h-full flex-col justify-between gap-3 p-3 lg:p-4">
          <header
            ref={headerRef}
            className={[
              'pointer-events-auto rounded-[24px] border border-white/10 bg-slate-950/62 p-4 shadow-glass backdrop-blur-2xl',
              isMobile ? 'max-w-none p-3' : 'max-w-[34rem] lg:p-5',
            ].join(' ')}
          >
            <HeaderChrome
              featureCount={datasetState.features.length}
              totalFiles={totalFiles}
              totalCollections={collections.length}
            />
          </header>

          {!isMobile ? (
            <div className="pointer-events-none flex justify-start">
              <aside
                ref={railRef}
                className="pointer-events-auto w-full max-w-[18rem] rounded-[24px] border border-white/10 bg-slate-950/72 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:max-w-[19rem] lg:p-4 xl:max-w-[20rem]"
                style={{
                  maxHeight: 'calc(100vh - 7.5rem)',
                  overflowY: 'auto',
                  scrollbarGutter: 'stable',
                }}
              >
                <ControlsChrome
                  activeCollection={activeCollection}
                  activeBatch={activeBatch}
                  collectionId={collectionId}
                  collections={collections}
                  datasetState={datasetState}
                  isMobile={false}
                  layoutMode={layoutMode}
                  onSelectBatch={setBatchFile}
                  onSelectCollection={setCollectionId}
                  onToggleControls={() => {}}
                  selectedFeature={selectedFeature}
                  showBody
                  totalFiles={totalFiles}
                  controlsOpen
                />
              </aside>
            </div>
          ) : null}
        </div>

        {isMobile ? (
          <aside
            ref={railRef}
            className="pointer-events-auto fixed inset-x-3 bottom-3 z-30 rounded-[28px] border border-white/10 bg-slate-950/84 shadow-[0_-24px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl transition-[max-height,transform] duration-300 ease-out"
            style={{
              maxHeight: controlsOpen ? '72vh' : '5.1rem',
              overflow: 'hidden',
              scrollbarGutter: 'stable',
            }}
          >
            <div className="px-3 pt-3 pb-3">
              <ControlsChrome
                activeCollection={activeCollection}
                activeBatch={activeBatch}
                collectionId={collectionId}
                collections={collections}
                datasetState={datasetState}
                isMobile
                layoutMode={layoutMode}
                onSelectBatch={setBatchFile}
                onSelectCollection={setCollectionId}
                onToggleControls={() => setControlsOpen((current) => !current)}
                selectedFeature={selectedFeature}
                showBody={controlsOpen}
                totalFiles={totalFiles}
                controlsOpen={controlsOpen}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
