import { useEffect, useMemo, useState } from 'react';
import BatchRail from './components/BatchRail.jsx';
import CollectionRail from './components/CollectionRail.jsx';
import CountryMapScene from './components/CountryMapScene.jsx';
import { collections, defaultCollectionId, getBatchByFile, getCollectionById } from './data/catalog.js';
import { loadDataset } from './data/loadDataset.js';
import { loadWorldCountries } from './data/loadWorldCountries.js';
import { selectCountriesForBatch } from './map/countryOverlay.js';

const defaultCollection = getCollectionById(defaultCollectionId);

function SummaryChip({ children, tone = 'default' }) {
  const toneClasses =
    tone === 'active'
      ? 'border-cyan-200 bg-cyan-200 text-slate-950'
      : tone === 'soft'
        ? 'border-white/10 bg-white/5 text-slate-200'
        : 'border-white/10 bg-white/5 text-slate-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.28em] ${toneClasses}`}>
      {children}
    </span>
  );
}

export default function App() {
  const [layoutMode, setLayoutMode] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
  );
  const [selection, setSelection] = useState({
    collectionId: defaultCollection.id,
    batchFile: defaultCollection.batches[0]?.file ?? '',
  });
  const [worldState, setWorldState] = useState({
    status: 'loading',
    countries: [],
    error: null,
  });
  const [batchState, setBatchState] = useState({
    status: 'loading',
    features: [],
    fileName: defaultCollection.batches[0]?.file ?? '',
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    loadWorldCountries(controller.signal)
      .then(({ countries }) => {
        if (cancelled) {
          return;
        }

        setWorldState({
          status: 'ready',
          countries,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        setWorldState({
          status: 'error',
          countries: [],
          error,
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const updateLayoutMode = () => {
      setLayoutMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };

    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);

    return () => {
      window.removeEventListener('resize', updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    if (!selection.batchFile) {
      setBatchState({
        status: 'ready',
        features: [],
        fileName: '',
        error: null,
      });
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    setBatchState({
      status: 'loading',
      features: [],
      fileName: selection.batchFile,
      error: null,
    });

    loadDataset(selection.batchFile, controller.signal)
      .then(({ features, fileName }) => {
        if (cancelled) {
          return;
        }

        setBatchState({
          status: 'ready',
          features,
          fileName,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        setBatchState({
          status: 'error',
          features: [],
          fileName: selection.batchFile,
          error,
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selection.batchFile]);

  const activeCollection = getCollectionById(selection.collectionId);
  const activeBatch = getBatchByFile(activeCollection, selection.batchFile);
  const renderedCountries = useMemo(() => {
    if (worldState.status !== 'ready' || batchState.status !== 'ready') {
      return [];
    }

    return selectCountriesForBatch(worldState.countries, batchState.features);
  }, [batchState.features, batchState.status, worldState.countries, worldState.status]);

  const handleSelectCollection = (collectionId) => {
    const nextCollection = getCollectionById(collectionId);

    setSelection({
      collectionId: nextCollection.id,
      batchFile: nextCollection.batches[0]?.file ?? '',
    });
  };

  const handleSelectBatch = (batchFile) => {
    setSelection((current) => ({
      ...current,
      batchFile,
    }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_30%),linear-gradient(180deg,#07101c_0%,#050814_52%,#03050a_100%)]" />
      <CountryMapScene countries={renderedCountries} />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="flex h-full flex-col justify-between gap-3 p-3 lg:p-4">
          <header className="pointer-events-auto max-w-[34rem] rounded-[28px] border border-white/10 bg-slate-950/62 p-3 shadow-[0_18px_60px_rgba(2,6,23,0.34)] backdrop-blur-2xl">
            <div className="flex flex-wrap gap-2">
              <SummaryChip tone="soft">🗺️</SummaryChip>
              <SummaryChip tone="active">{activeCollection.title}</SummaryChip>
              <SummaryChip>{activeBatch.label}</SummaryChip>
              <SummaryChip>{renderedCountries.length} countries</SummaryChip>
              {worldState.status === 'error' ? <SummaryChip>world error</SummaryChip> : null}
              {batchState.status === 'error' ? <SummaryChip>batch error</SummaryChip> : null}
            </div>
          </header>

          <aside className="pointer-events-auto max-h-[45vh] max-w-[26rem] overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/72 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:max-w-[30rem] lg:p-4">
            <div className="space-y-4">
              <CollectionRail
                collections={collections}
                activeCollectionId={activeCollection.id}
                onSelectCollection={handleSelectCollection}
                layoutMode={layoutMode}
              />
              <BatchRail
                batches={activeCollection.batches}
                activeBatchFile={activeBatch.file}
                onSelectBatch={handleSelectBatch}
                layoutMode={layoutMode}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
