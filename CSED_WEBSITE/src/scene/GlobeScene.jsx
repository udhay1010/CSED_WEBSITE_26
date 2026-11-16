import { Canvas } from '@react-three/fiber';
import { Component, useEffect, useState } from 'react';
import GlobeMesh from './Particles/GlobeMesh';
import { CAMERA_DISTANCE, CAMERA_FOV } from './Particles/particleConfig';
import { useIntroStore } from '../store/introStore';
import { isLand as approximateLand } from '../utils/earthTexture';

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export default function GlobeScene() {
  const compact = useMedia('(max-width: 767px)');
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const visible = useIntroStore(s => s.globeOpacity > 0);
  const [landMask, setLandMask] = useState(null);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/earth-land.geojson', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Coastline unavailable'); return response.json(); })
      .then(data => {
        // Rasterize public-domain Natural Earth coastlines once; sampling is O(1).
        const canvas = document.createElement('canvas');
        canvas.width = 2048; canvas.height = 1024;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = 'white';
        for (const feature of data.features) {
          const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
          for (const polygon of polygons) {
            ctx.beginPath();
            for (const ring of polygon) {
              ring.forEach(([lon, lat], i) => {
                const x = (lon + 180) / 360 * canvas.width;
                const y = (90 - lat) / 180 * canvas.height;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              });
              ctx.closePath();
            }
            ctx.fill('evenodd');
          }
        }
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        if (!controller.signal.aborted) setLandMask(() => (lat, lon) => {
          const x = Math.min(2047, Math.max(0, Math.floor((lon + 180) / 360 * 2048)));
          const y = Math.min(1023, Math.max(0, Math.floor((90 - lat) / 180 * 1024)));
          return pixels[(y * 2048 + x) * 4 + 3] > 128;
        });
      })
      .catch(error => { if (error.name !== 'AbortError') setLandMask(() => approximateLand); });
    return () => controller.abort();
  }, []);
  return (
    <SceneBoundary>
      <Canvas
        camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV, near: 0.1, far: 150 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, compact ? 1.25 : 1.5]}
        frameloop={visible && pageVisible ? 'always' : 'never'}
        fallback={null}
        style={{ width: '100%', height: '100%' }}
      >
        {landMask && <GlobeMesh isLand={landMask} compact={compact} reducedMotion={reducedMotion} />}
      </Canvas>
    </SceneBoundary>
  );
}
