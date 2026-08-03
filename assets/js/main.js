/**
 * HentaiZ Frontend - Entry Point
 */
import { initRender } from './render.js';
import { initWatchPage } from './watch.js';

const API_HOME_URL = 'https://cdn.elyriax.com/api/v1/hentai/home';

async function boot() {
  const pathname = window.location.pathname;

  if (pathname.startsWith('/watch')) {
    initWatchPage();
    return;
  }

  try {
    const res = await fetch(API_HOME_URL);
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
    console.warn('API fetch failed:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
