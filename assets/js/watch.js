/**
 * HentaiZ Frontend - Watch Page Handler v2.0
 * Production-ready streaming layout with skeleton loading,
 * SPA episode navigation, and smooth player transitions.
 */

import { formatViews, sanitizeText, normalizeImageURL, htmlToFragment } from './utils.js';

/* ───────────────────────────────────────────────────────────────
   STATE
   ─────────────────────────────────────────────────────────────── */
const watchState = {
  isLoading: false,
  currentSlug: null,
  abortController: null
};

/* ───────────────────────────────────────────────────────────────
   INIT
   ─────────────────────────────────────────────────────────────── */
export async function initWatchPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const slug = extractSlug();
  if (!slug) {
    renderError(main, 'URL không hợp lệ hoặc thiếu slug!');
    return;
  }

  // Cancel any in-flight request
  if (watchState.abortController) {
    watchState.abortController.abort();
  }

  await loadWatchPage(main, slug);
}

/* ───────────────────────────────────────────────────────────────
   ROUTING HELPERS
   ─────────────────────────────────────────────────────────────── */
function extractSlug() {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  return parts[1] || null;
}

function scrollToPlayer(behavior = 'smooth') {
  const player = document.querySelector('.watch-player-section');
  if (player) {
    const headerOffset = 80;
    const top = player.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior });
  }
}

/* ───────────────────────────────────────────────────────────────
   DATA FETCHING
   ─────────────────────────────────────────────────────────────── */
async function fetchWatchData(slug) {
  const API_URL = `https://cdn.elyriax.com/api/v1/hentai/watch?data=${encodeURIComponent(slug)}`;
  watchState.abortController = new AbortController();

  const res = await fetch(API_URL, { signal: watchState.abortController.signal });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lỗi máy chủ (${res.status})`);

  const data = await res.json();
  if (!data.ok || !data.anime) return null;

  return normalizeWatchData(data);
}

function normalizeWatchData(data) {
  const anime = data.anime || {};

  // Embed servers
  let servers = [];
  if (Array.isArray(data.embedUrls) && data.embedUrls.length > 0) {
    servers = data.embedUrls.map((item, idx) => ({
      name: item.name || `#${idx + 1}`,
      src: item.src
    }));
  } else if (data.embedUrl) {
    servers = [{ name: '#1', src: data.embedUrl }];
  }

  const defaultSrc = data.defaultEmbedUrl || (servers[0]?.src || '');

  // Parse Genres & Studios from categories if present
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
        if (cat.tags?.[0]) releaseYear = cat.tags[0].name;
      }
    });
  }

  return {
    anime: {
      ...anime,
      genres,
      studios,
      releaseYear,
      posterImage: normalizeImageURL(anime.posterImage?.filePath || anime.posterImage),
      backdropImage: normalizeImageURL(anime.backdropImage?.filePath || anime.backdropImage)
    },
    servers,
    defaultSrc,
    episodes: data.episodes || []
  };
}

/* ───────────────────────────────────────────────────────────────
   CORE LOADER
   ─────────────────────────────────────────────────────────────── */
async function loadWatchPage(container, slug) {
  if (watchState.isLoading && watchState.currentSlug === slug) return;
  watchState.isLoading = true;
  watchState.currentSlug = slug;

  // Show skeleton only if container is empty or has error
  const hasSkeleton = container.querySelector('.watch-skeleton');
  const hasContent = container.querySelector('.watch-container');
  const hasError = container.querySelector('.watch-error');

  if (!hasSkeleton && !hasContent && !hasError) {
    renderSkeleton(container);
  }

  try {
    const data = await fetchWatchData(slug);
    if (!data) {
      renderError(container, 'Bộ phim này không tồn tại hoặc đã bị gỡ bỏ.');
      return;
    }
    renderWatchUI(container, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[Watch Page Error]:', err);
    renderError(container, `Không thể tải dữ liệu: ${err.message}`);
  } finally {
    watchState.isLoading = false;
    watchState.abortController = null;
  }
}

/* ───────────────────────────────────────────────────────────────
   SKELETON
   ─────────────────────────────────────────────────────────────── */
function renderSkeleton(container) {
  const html = `
    <div class="watch-skeleton">
      <div class="skeleton-player shimmer"></div>

      <div class="skeleton-block">
        <div class="skeleton-servers">
          <div class="skeleton-pill shimmer"></div>
          <div class="skeleton-pill shimmer"></div>
          <div class="skeleton-pill shimmer"></div>
        </div>
      </div>

      <div class="skeleton-block">
        <div class="skeleton-episodes">
          ${Array(10).fill('<div class="skeleton-ep-btn shimmer"></div>').join('')}
        </div>
      </div>

      <div class="skeleton-block skeleton-info">
        <div class="skeleton-title shimmer"></div>
        <div class="skeleton-meta">
          <div class="skeleton-meta-item shimmer"></div>
          <div class="skeleton-meta-item shimmer"></div>
          <div class="skeleton-meta-item shimmer"></div>
        </div>
        <div class="skeleton-chips">
          <div class="skeleton-chip shimmer"></div>
          <div class="skeleton-chip shimmer"></div>
          <div class="skeleton-chip shimmer"></div>
          <div class="skeleton-chip shimmer"></div>
        </div>
        <div class="skeleton-desc">
          <div class="skeleton-line shimmer"></div>
          <div class="skeleton-line medium shimmer"></div>
          <div class="skeleton-line short shimmer"></div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

/* ───────────────────────────────────────────────────────────────
   MAIN RENDER
   ─────────────────────────────────────────────────────────────── */
function renderWatchUI(container, data) {
  const { anime, servers, defaultSrc, episodes } = data;

  // Update document title
  const epLabel = anime.episodeNumber ? ` - Tập ${anime.episodeNumber}` : '';
  document.title = `${sanitizeText(anime.title)}${epLabel} | HentaiZ`;

  // Build sections
  const playerFrag = renderPlayer(defaultSrc);
  const serversFrag = servers.length > 1 ? renderServers(servers, defaultSrc) : null;
  const episodesFrag = episodes.length > 0 ? renderEpisodes(episodes, anime.slug) : null;
  const infoFrag = renderInfo(anime);

  // Assemble
  const wrapper = document.createElement('div');
  wrapper.className = 'watch-container';
  wrapper.appendChild(playerFrag);
  if (serversFrag) wrapper.appendChild(serversFrag);
  if (episodesFrag) wrapper.appendChild(episodesFrag);
  wrapper.appendChild(infoFrag);

  container.innerHTML = '';
  container.appendChild(wrapper);

  // Bind events
  bindEvents(container, data);
}

/* ───────────────────────────────────────────────────────────────
   PLAYER
   ─────────────────────────────────────────────────────────────── */
function renderPlayer(defaultSrc) {
  const html = `
    <section class="watch-player-section" id="watch-player">
      <div class="watch-player-wrap">
        ${defaultSrc ? `
          <iframe 
            class="watch-player-frame" 
            id="video-iframe"
            src="${defaultSrc}" 
            allowfullscreen 
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="eager"
          ></iframe>
        ` : ''}
        <div class="watch-player-loader" id="player-loader">
          <div class="player-spinner"></div>
          <div class="player-loader-text">
            Đang tải player <span class="player-loader-brand">HentaiZ</span>
          </div>
        </div>
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

/* ───────────────────────────────────────────────────────────────
   SERVERS
   ─────────────────────────────────────────────────────────────── */
function renderServers(servers, defaultSrc) {
  const pills = servers.map((srv, idx) => {
    const isActive = srv.src === defaultSrc || (idx === 0 && !defaultSrc);
    return `
      <button 
        class="server-pill ${isActive ? 'active' : ''}" 
        data-src="${srv.src}"
        type="button"
      >
        <span class="pill-icon">🚀</span>
        <span class="pill-label">Server ${sanitizeText(srv.name)}</span>
      </button>
    `;
  }).join('');

  const html = `
    <section class="watch-servers-section" aria-label="Chọn server">
      <div class="watch-servers-header">
        <span>⚙️</span>
        <span>Đổi Server</span>
      </div>
      <div class="watch-servers-list" role="group" aria-label="Danh sách server">
        ${pills}
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

/* ───────────────────────────────────────────────────────────────
   EPISODES
   ─────────────────────────────────────────────────────────────── */
function renderEpisodes(episodes, currentSlug) {
  const buttons = episodes.map(ep => {
    const isActive = ep.slug === currentSlug;
    const icon = isActive ? '<span class="ep-icon">▶</span>' : '';
    return `
      <button 
        class="episode-btn ${isActive ? 'active' : ''}" 
        data-slug="${ep.slug}"
        type="button"
        ${isActive ? 'aria-current="true"' : ''}
      >
        ${icon}
        <span class="ep-label">Tập ${ep.episodeNumber || 1}</span>
      </button>
    `;
  }).join('');

  const html = `
    <section class="watch-episodes-section" aria-label="Danh sách tập">
      <div class="watch-episodes-header">
        <span>📺 Danh Sách Tập</span>
        <span class="watch-episodes-count">(${episodes.length} tập)</span>
      </div>
      <div class="episode-grid" role="list">
        ${buttons}
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

/* ───────────────────────────────────────────────────────────────
   INFO
   ─────────────────────────────────────────────────────────────── */
function renderInfo(anime) {
  const studios = (anime.studios || []).map(s => {
    const slug = s.slug || (s.url ? s.url.replace('/studio/', '') : '');
    return slug
      ? `<a href="/studios/${slug}" class="meta-studio">${sanitizeText(s.name)}</a>`
      : `<span>${sanitizeText(s.name)}</span>`;
  }).join(', ');

  const genres = (anime.genres || []).map(g => {
    const slug = g.slug || (g.url ? g.url.replace('/category/', '') : '');
    return `<a href="/genres/${slug}" class="watch-genre-chip">${sanitizeText(g.name)}</a>`;
  }).join('');

  const epBadge = anime.episodeNumber
    ? `<span class="meta-badge">Tập ${anime.episodeNumber}</span>`
    : '';

  const views = anime.viewsTotal
    ? `<span class="meta-item">👁️ ${formatViews(anime.viewsTotal)} lượt xem</span>`
    : '';

  const year = `<span class="meta-item">📅 Năm: ${sanitizeText(String(anime.releaseYear))}</span>`;
  const studioMeta = studios ? `<span class="meta-item">🏢 Studio: ${studios}</span>` : '';

  const desc = sanitizeText(anime.description) || 'Chưa có mô tả cho bộ phim này.';

  const html = `
    <section class="watch-info-section" aria-label="Thông tin anime">
      <div class="watch-info-header">
        <h1 class="watch-info-title">${sanitizeText(anime.title)}</h1>
      </div>

      <div class="watch-info-meta">
        ${epBadge}
        ${views}
        ${year}
        ${studioMeta ? `<span class="meta-separator"></span>${studioMeta}` : ''}
      </div>

      ${genres ? `<div class="watch-genres">${genres}</div>` : ''}

      <div class="watch-description">
        <h4 class="watch-description-title">Mô tả nội dung</h4>
        <p class="watch-description-text">${desc}</p>
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

/* ───────────────────────────────────────────────────────────────
   EVENT BINDING
   ─────────────────────────────────────────────────────────────── */
function bindEvents(container, data) {
  const iframe = container.querySelector('.watch-player-frame');
  const loader = container.querySelector('.watch-player-loader');
  const serverBtns = container.querySelectorAll('.server-pill');
  const episodeBtns = container.querySelectorAll('.episode-btn');

  // Player load handler
  if (iframe) {
    const onLoad = () => {
      if (loader) loader.classList.add('hidden');
      iframe.classList.add('loaded');
    };
    iframe.addEventListener('load', onLoad);

    // Fallback: hide loader after timeout if load event doesn't fire
    const fallbackTimer = setTimeout(() => {
      if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        iframe.classList.add('loaded');
      }
    }, 4000);

    // Store cleanup ref on iframe for edge cases
    iframe._watchCleanup = () => {
      iframe.removeEventListener('load', onLoad);
      clearTimeout(fallbackTimer);
    };
  } else if (loader) {
    loader.classList.add('hidden');
  }

  // Server switching
  serverBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      if (!src || btn.classList.contains('active')) return;

      // Update active state
      serverBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update player
      if (iframe && loader) {
        loader.classList.remove('hidden');
        iframe.classList.remove('loaded');
        iframe.src = src;
      }
    });
  });

  // Episode SPA navigation
  episodeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slug = btn.dataset.slug;
      if (!slug || slug === watchState.currentSlug) return;

      e.preventDefault();
      history.pushState(null, '', `/watch/${slug}`);
      loadWatchPage(container, slug);
      scrollToPlayer();
    });
  });
}

/* ───────────────────────────────────────────────────────────────
   ERROR STATE
   ─────────────────────────────────────────────────────────────── */
function renderError(container, message) {
  const html = `
    <div class="watch-error">
      <div class="watch-error-code">404</div>
      <h2 class="watch-error-title">Không Tìm Thấy Phim</h2>
      <p class="watch-error-message">${sanitizeText(message)}</p>
      <a href="/" class="watch-error-btn">
        <span>←</span>
        <span>Về Trang Chủ</span>
      </a>
    </div>
  `;
  container.innerHTML = html;
}

/* ───────────────────────────────────────────────────────────────
   POPSTATE HANDLER (SPA back/forward)
   ─────────────────────────────────────────────────────────────── */
window.addEventListener('popstate', () => {
  if (window.location.pathname.startsWith('/watch')) {
    const main = document.getElementById('app-main');
    const slug = extractSlug();
    if (slug && main && slug !== watchState.currentSlug) {
      loadWatchPage(main, slug);
    }
  }
});
