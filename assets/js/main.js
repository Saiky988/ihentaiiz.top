/**
 * HentaiZ Frontend - Entry Point
 */
import { initRender } from './render.js';

const API_URL = 'https://cdn.elyriax.com/api/v1/hentai/home';

async function boot() {
  try {
    // Try fetch from API first
    const res = await fetch(API_URL, { credentials: 'omit' });
    if (!res.ok) throw new Error('API fetch failed');
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim());
    const objects = lines.map(l => JSON.parse(l)).filter(Boolean);

    const mainData = objects.find(o => o.type === 'data' && o.nodes);
    const chunks = objects.filter(o => o.type === 'chunk');

    if (mainData) {
      initRender(mainData.nodes, chunks);
      return;
    }
  } catch (e) {
    console.warn('API fetch failed, falling back to embedded data:', e);
  }

  // Fallback: use embedded window.__DATA if present (SSR injection)
  if (window.__DATA) {
    const nodes = window.__DATA.nodes || [];
    const chunks = window.__DATA.chunks || [];
    initRender(nodes, chunks);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
