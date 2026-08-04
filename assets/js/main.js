/**
 * HentaiZ Frontend - Entry Point
 */
import { initRender, renderCommonLayout } from './render.js';
import { initWatchPage } from './watch.js';

const API_HOME_URL = 'https://cdn.elyriax.com/api/v1/hentai/home';

async function boot() {
  const pathname = window.location.pathname;

  let nodes = null;
  let chunks = null;

  // 1. Luôn tải dữ liệu Home để render Header, Nav, Footer
  try {
    const res = await fetch(API_HOME_URL);
    if (!res.ok) throw new Error('API fetch failed');
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim());
    const objects = lines.map(l => JSON.parse(l)).filter(Boolean);

    const mainData = objects.find(o => o.type === 'data' && o.nodes);
    chunks = objects.filter(o => o.type === 'chunk');

    if (mainData) {
      nodes = mainData.nodes;
      // Dựng Header, Nav và Footer chung
      renderCommonLayout(nodes, chunks);
    }
  } catch (e) {
    console.warn('API Home fetch failed:', e);
  }

  // 2. Phân luồng trang
  if (pathname.startsWith('/watch')) {
    // Nếu ở trang watch, gọi hàm render watch (Header/Footer đã được tạo ở trên)
    initWatchPage();
    return;
  }

  // Nếu ở trang chủ, render nội dung các section/sidebar
  if (nodes) {
    initRender(nodes, chunks);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
