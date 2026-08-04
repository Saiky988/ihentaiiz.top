/**
 * HentaiZ Frontend - Watch Page Handler
 * Tự động adapter cấu trúc JSON cũ & mới + Hỗ trợ chọn Server Player
 */

import { formatViews, sanitizeText } from './utils.js';

export async function initWatchPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[1];

  if (!slug) {
    renderNotFound(main, 'URL không hợp lệ hoặc thiếu slug!');
    return;
  }

  renderSkeleton(main);

  try {
    const API_URL = `https://cdn.elyriax.com/api/v1/hentai/watch?data=${encodeURIComponent(slug)}`;
    const res = await fetch(API_URL);

    if (res.status === 404) {
      renderNotFound(main, 'Bộ phim này không tồn tại hoặc đã bị gỡ bỏ.');
      return;
    }

    if (!res.ok) {
      throw new Error(`Lỗi máy chủ (${res.status})`);
    }

    const data = await res.json();

    if (!data.ok || !data.anime) {
      renderNotFound(main, 'Dữ liệu trả về không hợp lệ.');
      return;
    }

    // Adapt dữ liệu để phù hợp với cả cấu trúc cũ & mới
    const normalizedData = normalizeWatchData(data);

    // Render UI chính
    renderWatchUI(main, normalizedData);

  } catch (err) {
    console.error('[Watch Page Error]:', err);
    renderNotFound(main, `Không thể tải dữ liệu: ${err.message}`);
  }
}

/**
 * Normalizer: Chuẩn hóa dữ liệu giữa cấu trúc cũ và mới
 */
function normalizeWatchData(data) {
  const anime = data.anime || {};

  // 1. Lấy danh sách Embed Server
  let servers = [];
  if (Array.isArray(data.embedUrls) && data.embedUrls.length > 0) {
    servers = data.embedUrls.map(item => ({
      name: item.name || 'Server',
      src: item.src
    }));
  } else if (data.embedUrl) {
    servers = [{ name: '#1', src: data.embedUrl }];
  }

  const defaultSrc = data.defaultEmbedUrl || (servers[0] ? servers[0].src : '');

  // 2. Parse Genres & Studios từ categories (nếu là dạng JSON mới)
  let genres = anime.genres || [];
  let studios = anime.studios || [];
  let releaseYear = anime.releaseYear || 'N/A';

  if (Array.isArray(anime.categories)) {
    anime.categories.forEach(cat => {
      const label = (cat.label || '').toLowerCase();
      if (label.includes('thể loại') || label.includes('category')) {
        genres = cat.tags || [];
      } else if (label.includes('studio')) {
        studios = cat.tags || [];
      } else if (label.includes('năm') || label.includes('year')) {
        if (cat.tags && cat.tags[0]) releaseYear = cat.tags[0].name;
      }
    });
  }

  return {
    anime: {
      ...anime,
      genres,
      studios,
      releaseYear
    },
    servers,
    defaultSrc,
    episodes: data.episodes || []
  };
}

/**
 * Render Giao diện chính
 */
function renderWatchUI(container, { anime, servers, defaultSrc, episodes }) {
  document.title = `${anime.title} ${anime.episodeNumber ? `- Tập ${anime.episodeNumber}` : ''} | HentaiZ`;

  const genresHTML = (anime.genres || []).map(g => {
    const slug = g.slug || (g.url ? g.url.replace('/category/', '') : '');
    return `<a href="/genres/${slug}" class="filter-chip">${sanitizeText(g.name)}</a>`;
  }).join('');

  const studiosHTML = (anime.studios || []).map(s => {
    const slug = s.slug || (s.url ? s.url.replace('/studio/', '') : '');
    return `<a href="/studios/${slug}" style="color: #ff2d7d; font-weight: 600; text-decoration: none;">${sanitizeText(s.name)}</a>`;
  }).join(', ');

  const episodesHTML = (episodes || []).map(ep => {
    const isActive = ep.slug === anime.slug ? 'active' : '';
    return `
      <a href="/watch/${ep.slug}" class="ep-btn ${isActive}">
        ${ep.slug === anime.slug ? '▶' : ''} Tập ${ep.episodeNumber || 1}
      </a>
    `;
  }).join('');

  // Nút chọn Server dự phòng
  const serversHTML = servers.map((srv, idx) => {
    const isPrimary = srv.src === defaultSrc || (idx === 0 && !defaultSrc);
    const activeClass = isPrimary ? 'active' : '';
    const proxyUrl = `https://cdn.elyriax.com/api/v1/hentai/player?url=${encodeURIComponent(srv.src)}`;
    return `
      <button class="server-btn ${activeClass}" data-src="${proxyUrl}">
        🚀 Server ${srv.name}
      </button>
    `;
  }).join('');

  const initialProxyUrl = defaultSrc ? `https://cdn.elyriax.com/api/v1/hentai/player?url=${encodeURIComponent(defaultSrc)}` : '';

  container.innerHTML = `
    <div class="watch-container" style="max-width: 1400px; margin: 0 auto; padding: 20px 16px;">
      
      <!-- Video Player Frame -->
      <div class="player-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        ${initialProxyUrl ? `
          <iframe id="video-iframe" src="${initialProxyUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        ` : `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">
            <span>⚠️ Nguồn video chưa sẵn sàng</span>
          </div>
        `}
      </div>

      <!-- Server Selector Bar -->
      ${servers.length > 1 ? `
        <div class="server-selector-section" style="margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px 16px;">
          <span style="font-size: 13px; font-weight: 700; color: #9ca3af; display: flex; align-items: center; gap: 6px;">
            <span>⚙️ Đổi Server:</span>
          </span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${serversHTML}
          </div>
        </div>
      ` : ''}

      <!-- Episode Selector -->
      <div class="episodes-section" style="margin-top: 20px; background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: #fff; display: flex; align-items: center; gap: 8px;">
          <span>📺 Danh Sách Tập</span>
          <span style="font-size: 12px; color: #9ca3af; font-weight: 400;">(${episodes?.length || 0} tập)</span>
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${episodesHTML}
        </div>
      </div>

      <!-- Anime Information -->
      <div class="anime-info-section" style="margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 24px;">
        <div style="background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px 0; color: #fff;">
                ${sanitizeText(anime.title)}
              </h1>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #9ca3af;">
                ${anime.episodeNumber ? `
                  <span style="background: rgba(255,45,125,0.15); color: #ff2d7d; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                    Tập ${anime.episodeNumber}
                  </span>
                ` : ''}
                ${anime.viewsTotal ? `<span>👁️ ${formatViews(anime.viewsTotal)} lượt xem</span>` : ''}
                <span>📅 Năm: ${anime.releaseYear || 'N/A'}</span>
                ${studiosHTML ? `<span>🏢 Studio: ${studiosHTML}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Genres list -->
          <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px;">
            ${genresHTML}
          </div>

          <!-- Description -->
          <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
            <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 8px 0; color: #fff;">Mô tả nội dung:</h4>
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">
              ${sanitizeText(anime.description) || 'Chưa có mô tả cho bộ phim này.'}
            </p>
          </div>

        </div>
      </div>

    </div>
  `;

  // Thêm sự kiện click đổi Server video
  bindServerEvents(container);
}

/**
 * Xử lý sự kiện khi bấm đổi Server
 */
function bindServerEvents(container) {
  const serverBtns = container.querySelectorAll('.server-btn');
  const iframe = container.querySelector('#video-iframe');

  if (!iframe || !serverBtns.length) return;

  serverBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      if (!src) return;

      // Đổi class active
      serverBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Đổi src iframe
      iframe.src = src;
    });
  });
}

// Skeleton Loading
function renderSkeleton(container) {
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 20px 16px;">
      <div style="width: 100%; aspect-ratio: 16/9; background: #111118; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #ff2d7d; font-weight: 700;">
        ⏳ Đang tải Player...
      </div>
    </div>
  `;
}

// 404 Not Found Page
function renderNotFound(container, message) {
  container.innerHTML = `
    <div style="padding: 80px 20px; max-width: 500px; margin: 0 auto; text-align: center;">
      <div style="font-size: 64px; font-weight: 900; color: #ff2d7d;">404</div>
      <h2 style="font-size: 20px; font-weight: 700; margin: 12px 0;">Không Tìm Thấy Phim</h2>
      <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px;">${message}</p>
      <a href="/" style="display: inline-block; padding: 10px 24px; background: #ff2d7d; color: #fff; font-weight: 700; border-radius: 12px; text-decoration: none;">
        ← Về Trang Chủ
      </a>
    </div>
  `;
}
