import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { editorialStyle } from '../map/style.js';
import { projectCountryFeatures } from '../map/countryOverlay.js';
import CountryImageOverlay from './CountryImageOverlay.jsx';

export default function CountryMapScene({ countries }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [projectedCountries, setProjectedCountries] = useState([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: editorialStyle,
      center: [8, 18],
      zoom: 1.35,
      minZoom: 1.1,
      maxZoom: 5.75,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => {
      setMapReady(true);
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || countries.length === 0) {
      return undefined;
    }

    const map = mapRef.current;
    let animationFrame = 0;

    const update = () => {
      const canvas = map.getCanvas();
      const nextViewport = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };

      if (nextViewport.width <= 0 || nextViewport.height <= 0) {
        animationFrame = window.requestAnimationFrame(update);
        return;
      }

      setViewport((current) =>
        current.width === nextViewport.width && current.height === nextViewport.height ? current : nextViewport,
      );
      setProjectedCountries(projectCountryFeatures(countries, (lngLat) => map.project(lngLat), nextViewport));
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(map.getContainer());
    map.on('move', update);
    map.on('zoom', update);
    map.on('resize', update);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      map.off('move', update);
      map.off('zoom', update);
      map.off('resize', update);
    };
  }, [countries, mapReady]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.1),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,0.28)_68%,rgba(2,6,23,0.56))]" />
      <CountryImageOverlay countries={projectedCountries} viewport={viewport} />
      {!mapReady ? (
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-[10px] tracking-[0.3em] text-slate-200 backdrop-blur-xl">
          Loading world boundaries...
        </div>
      ) : null}
    </div>
  );
}
