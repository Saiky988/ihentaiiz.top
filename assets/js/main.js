/**
 * HentaiZ Frontend - Entry Point
 */
import { renderSharedUI, renderHomeBody } from './render.js';
import { initWatchPage } from './watch.js';
import { parseHomeData } from './parser.js';

const API_HOME_URL = 'https://cdn.elyriax.com/api/v1/hentai/home';

async function boot() {
  const pathname = window.location.pathname;

  // Always fetch home data first for shared layout (header, nav, footer)
  let parsed = null;
  try {
    const res = await fetch(API_HOME_URL);
    if (!res.ok) throw new Error('API fetch failed');
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim());
    const objects = lines.map(l => JSON.parse(l)).filter(Boolean);

    const mainData = objects.find(o => o.type === 'data' && o.nodes);
    const chunks = objects.filter(o => o.type === 'chunk');

    if (mainData) {
      parsed = parseHomeData(mainData.nodes, chunks);
    }
  } catch (e) {
    console.warn('API fetch failed:', e);
  }

  // Render shared layout (header, nav, footer) for ALL pages
  if (parsed) {
    renderSharedUI(parsed);
  }

  // Route to specific page content
  if (pathname.startsWith('/watch')) {
    initWatchPage();
    return;
  }

  // Home page body content
  if (parsed) {
    renderHomeBody(parsed);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
