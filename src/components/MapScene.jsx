import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { editorialStyle } from '../map/style.js';
import { projectAnchors } from '../map/overlay.js';
import FeatureOverlay from './FeatureOverlay.jsx';

export default function MapScene({
  features,
  activeFeatureId,
  onSelectFeature,
  collectionTitle,
  batchLabel,
  chromeInsets,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [anchors, setAnchors] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: editorialStyle,
      center: [15, 54.5],
      zoom: 3.45,
      minZoom: 1.8,
      maxZoom: 8.5,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const handleLoad = () => {
      setMapReady(true);
    };

    map.on('load', handleLoad);
    mapRef.current = map;

    return () => {
      map.off('load', handleLoad);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || features.length === 0) {
      return;
    }

    const map = mapRef.current;
    const bounds = new maplibregl.LngLatBounds();

    for (const feature of features) {
      bounds.extend([feature.lng, feature.lat]);
    }

    map.fitBounds(bounds, {
      padding: {
        top: (chromeInsets?.top ?? 0) + 24,
        right: (chromeInsets?.right ?? 0) + 24,
        bottom: (chromeInsets?.bottom ?? 0) + 24,
        left: (chromeInsets?.left ?? 0) + 24,
      },
      duration: 1200,
      maxZoom: 4.6,
    });
  }, [chromeInsets?.bottom, chromeInsets?.left, chromeInsets?.right, chromeInsets?.top, features, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return undefined;
    }

    const map = mapRef.current;
    const container = map.getContainer();
    let animationFrame = 0;
    const update = () => {
      const canvas = map.getCanvas();
      const viewport = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };

      if (viewport.width === 0 || viewport.height === 0) {
        animationFrame = window.requestAnimationFrame(update);
        return;
      }

      setAnchors(projectAnchors(features, (lngLat) => map.project(lngLat), viewport, chromeInsets));
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);
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
  }, [chromeInsets, features, mapReady]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.14),rgba(2,6,23,0.32)_70%,rgba(2,6,23,0.62))]" />
      <FeatureOverlay
        anchors={anchors}
        activeFeatureId={activeFeatureId}
        onSelectFeature={onSelectFeature}
        collectionTitle={collectionTitle}
        batchLabel={batchLabel}
      />
    </div>
  );
}
