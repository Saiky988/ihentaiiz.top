/**
 * HentaiZ Frontend - Watch Page Handler
 * Render giao diện xem phim với JSON đã qua xử lý từ Backend
 */

import { formatViews, sanitizeText } from './utils.js';

export async function initWatchPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  // 1. Lấy slug từ pathname (/watch/:slug)
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  const slug = parts[1];

  if (!slug) {
    renderNotFound(main, 'URL không hợp lệ hoặc thiếu slug!');
    return;
  }

  // 2. Render Loading Skeleton
  renderSkeleton(main);

  try {
    // 3. Fetch dữ liệu từ API CDN
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

    // 4. Render giao diện phim chính thức
    renderWatchUI(main, data);

  } catch (err) {
    console.error('[Watch Page Error]:', err);
    renderNotFound(main, `Không thể tải dữ liệu: ${err.message}`);
  }
}

// Render Giao diện Watch chính
function renderWatchUI(container, { anime, embedUrl, episodes }) {
  // Cập nhật Document Title
  document.title = `${anime.title} - Tập ${anime.episodeNumber} | HentaiZ`;

  const genresHTML = (anime.genres || []).map(g => `
    <a href="/genres/${g.slug}" class="filter-chip">${sanitizeText(g.name)}</a>
  `).join('');

  const studiosHTML = (anime.studios || []).map(s => `
    <a href="/studios/${s.slug}" style="color: #ff2d7d; font-weight: 600; text-decoration: none;">${sanitizeText(s.name)}</a>
  `).join(', ');

  const episodesHTML = (episodes || []).map(ep => {
    const isActive = ep.slug === anime.slug ? 'active' : '';
    return `
      <a href="/watch/${ep.slug}" class="ep-btn ${isActive}">
        ${ep.slug === anime.slug ? '▶' : ''} Tập ${ep.episodeNumber}
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <div class="watch-container" style="max-width: 1400px; margin: 0 auto; padding: 20px 16px;">
      
      <!-- Video Iframe Section -->
      <div class="player-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        ${embedUrl ? `
          <iframe src="${embedUrl}" style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;" allowfullscreen allow="autoplay; encrypted-media"></iframe>
        ` : `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #9ca3af;">
            <span>⚠️ Nguồn video chưa sẵn sàng</span>
          </div>
        `}
      </div>

      <!-- Episode Selector -->
      <div class="episodes-section" style="margin-top: 24px; background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: #fff; display: flex; align-items: center; gap: 8px;">
          <span>📺 Danh Sách Tập</span>
          <span style="font-size: 12px; color: #9ca3af; font-weight: 400;">(${episodes?.length || 0} tập)</span>
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
          ${episodesHTML}
        </div>
      </div>

      <!-- Movie Details -->
      <div class="anime-info-section" style="margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 24px;">
        <div style="background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px 0; color: #fff;">
                ${sanitizeText(anime.title)}
              </h1>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #9ca3af;">
                <span style="background: rgba(255,45,125,0.15); color: #ff2d7d; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                  Tập ${anime.episodeNumber}
                </span>
                <span>👁️ ${formatViews(anime.viewsTotal)} lượt xem</span>
                <span>📅 Năm: ${anime.releaseYear || 'N/A'}</span>
                ${studiosHTML ? `<span>🏢 Studio: ${studiosHTML}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Genres -->
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
}

// Loading Skeleton
function renderSkeleton(container) {
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto; padding: 20px 16px;">
      <div style="width: 100%; aspect-ratio: 16/9; background: #111118; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; color: #ff2d7d; font-weight: 700;">
        ⏳ Đang tải Player...
      </div>
    </div>
  `;
}

// 404 Page
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
