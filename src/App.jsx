import { useEffect, useState } from 'react';
import CountryMapScene from './components/CountryMapScene.jsx';
import { loadWorldCountries } from './data/loadWorldCountries.js';

function HeaderChrome({ countryCount }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-[18rem]">
        <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.36em] text-cyan-100/80">
          🗺️ ISO2 spike
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-[0.95] tracking-[-0.05em] text-white sm:text-[2.6rem]">
          Country image fills
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The map now treats each country as a single keyed surface, so one custom image can fill the whole
          country shape.
        </p>
      </div>

      <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] tracking-[0.28em] text-slate-200">
        {countryCount} countries
      </div>
    </div>
  );
}

function CountryRail({ countries }) {
  const samples = countries.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-2">
      {samples.map((country) => (
        <div
          key={country.iso2}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 shadow-[0_12px_36px_rgba(2,6,23,0.2)]"
        >
          <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
            <p className="text-[10px] tracking-[0.28em] text-cyan-100/80">{country.iso2}</p>
            <p className="mt-1 truncate text-sm text-white">{country.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoChrome({ countries, worldLoadingState }) {
  const readyMessage =
    worldLoadingState.status === 'error'
      ? worldLoadingState.error?.message ?? 'Unable to load the world country boundary source.'
      : worldLoadingState.status === 'loading'
        ? 'Loading the world country boundary source...'
        : 'Only countries with a matching ISO2 image are rendered.';

  return (
    <div className="space-y-4">
      <p className="text-[10px] tracking-[0.35em] text-slate-400">🗂️ Country images</p>
      <h2 className="font-display text-xl text-white">ISO2 keyed mapping</h2>
      <p className="text-sm leading-6 text-slate-300">{readyMessage}</p>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-200">
          <div className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-center">
            {countries.length} countries
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-center">
            1 image per country
          </div>
        </div>
      </div>
      <CountryRail countries={countries} />
    </div>
  );
}

export default function App() {
  const [worldLoadingState, setWorldLoadingState] = useState({
    status: 'loading',
    countries: [],
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

        setWorldLoadingState({
          status: 'ready',
          countries,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }

        setWorldLoadingState({
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

  const countries = worldLoadingState.countries;

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_30%),linear-gradient(180deg,#07101c_0%,#050814_52%,#03050a_100%)]" />
      <CountryMapScene countries={worldLoadingState.countries} />

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="flex h-full flex-col justify-between gap-3 p-3 lg:p-4">
          <header className="pointer-events-auto max-w-[36rem] rounded-[24px] border border-white/10 bg-slate-950/62 p-4 shadow-glass backdrop-blur-2xl lg:p-5">
            <HeaderChrome countryCount={worldLoadingState.countries.length} />
          </header>

          <aside className="pointer-events-auto max-h-[40vh] max-w-[22rem] overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/72 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl lg:max-w-[24rem] lg:p-4">
            <InfoChrome countries={countries} worldLoadingState={worldLoadingState} />
          </aside>
        </div>
      </div>
    </main>
  );
}
