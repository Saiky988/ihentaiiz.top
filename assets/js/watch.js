/**
 * HentaiZ Frontend - Watch Page Handler
 * Consistent with Home Page design language
 */

import { formatViews, sanitizeText, normalizeImageURL, htmlToFragment, createLazyObserver } from './utils.js';

/* ───────────────────────────────────────────────────────────────
   STATE
   ─────────────────────────────────────────────────────────────── */
const watchState = {
  isLoading: false,
  currentSlug: null,
  abortController: null,
  lazyObserver: null
};

/* ───────────────────────────────────────────────────────────────
   INIT
   ─────────────────────────────────────────────────────────────── */
export async function initWatchPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const slug = extractSlug();
  if (!slug) {
    renderError(main, 'URL khong hop le hoac thieu slug!');
    return;
  }

  if (watchState.abortController) {
    watchState.abortController.abort();
  }

  await loadWatchPage(main, slug);
}

/* ───────────────────────────────────────────────────────────────
   ROUTING HELPERS
   ─────────────────────────────────────────────────────────────── */
function extractSlug() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] || null;
}

function scrollToPlayer(behavior = 'smooth') {
  const player = document.querySelector('.watch-player-section');
  if (!player) return;
  const headerOffset = 80;
  const top = player.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior });
}

/* ───────────────────────────────────────────────────────────────
   DATA FETCHING
   ─────────────────────────────────────────────────────────────── */
async function fetchWatchData(slug) {
  const API_URL = `https://cdn.elyriax.com/api/v1/hentai/watch?data=${encodeURIComponent(slug)}`;
  watchState.abortController = new AbortController();

  const res = await fetch(API_URL, { signal: watchState.abortController.signal });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Loi may chu (${res.status})`);

  const data = await res.json();
  if (!data.ok || !data.anime) return null;

  return normalizeWatchData(data);
}

function normalizeWatchData(data) {
  const anime = data.anime || {};

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

  let genres = anime.genres || [];
  let studios = anime.studios || [];
  let releaseYear = anime.releaseYear || 'N/A';

  if (Array.isArray(anime.categories)) {
    anime.categories.forEach(cat => {
      const label = (cat.label || '').toLowerCase();
      if (label.includes('the loai') || label.includes('category')) {
        genres = cat.tags || [];
      } else if (label.includes('studio')) {
        studios = cat.tags || [];
      } else if (label.includes('nam') || label.includes('year')) {
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

  const hasContent = container.querySelector('.watch-container, .watch-skeleton, .watch-error');
  if (!hasContent) {
    renderSkeleton(container);
  }

  try {
    const data = await fetchWatchData(slug);
    if (!data) {
      renderError(container, 'Bo phim nay khong ton tai hoac da bi go bo.');
      return;
    }
    renderWatchUI(container, data);
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('[Watch Page Error]:', err);
    renderError(container, `Khong the tai du lieu: ${err.message}`);
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
      <div class="watch-skeleton-hero skeleton">
        <div class="skeleton-hero-content" style="position:absolute;bottom:0;left:0;right:0;padding:var(--space-8) var(--space-4);display:flex;flex-direction:column;gap:var(--space-3);max-width:600px;">
          <div class="skeleton skeleton-text" style="width:120px;height:20px;"></div>
          <div class="skeleton skeleton-title" style="width:70%;height:36px;"></div>
          <div class="skeleton skeleton-text" style="width:50%;height:16px;"></div>
        </div>
      </div>

      <div class="watch-skeleton-player skeleton"></div>

      <div class="watch-skeleton-section">
        <div class="skeleton skeleton-text-sm" style="width:100px;height:14px;margin-bottom:var(--space-2);"></div>
        <div class="watch-skeleton-pills">
          <div class="watch-skeleton-pill skeleton"></div>
          <div class="watch-skeleton-pill skeleton"></div>
          <div class="watch-skeleton-pill skeleton"></div>
        </div>
      </div>

      <div class="watch-skeleton-section">
        <div class="skeleton skeleton-text-sm" style="width:140px;height:14px;margin-bottom:var(--space-2);"></div>
        <div class="watch-skeleton-episodes">
          ${Array(10).fill('<div class="watch-skeleton-ep-btn skeleton"></div>').join('')}
        </div>
      </div>

      <div class="watch-skeleton-section">
        <div class="watch-skeleton-title skeleton"></div>
        <div class="watch-skeleton-meta">
          <div class="watch-skeleton-meta-item skeleton"></div>
          <div class="watch-skeleton-meta-item skeleton"></div>
          <div class="watch-skeleton-meta-item skeleton"></div>
        </div>
        <div class="watch-skeleton-chips">
          <div class="watch-skeleton-chip skeleton"></div>
          <div class="watch-skeleton-chip skeleton"></div>
          <div class="watch-skeleton-chip skeleton"></div>
          <div class="watch-skeleton-chip skeleton"></div>
        </div>
        <div class="watch-skeleton-desc">
          <div class="watch-skeleton-line skeleton"></div>
          <div class="watch-skeleton-line medium skeleton"></div>
          <div class="watch-skeleton-line short skeleton"></div>
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

  const epLabel = anime.episodeNumber ? ` - Tap ${anime.episodeNumber}` : '';
  document.title = `${sanitizeText(anime.title)}${epLabel} | HentaiZ`;

  const heroFrag = renderHero(anime);
  const playerFrag = renderPlayer(defaultSrc);
  const serversFrag = servers.length > 1 ? renderServers(servers, defaultSrc) : null;
  const episodesFrag = episodes.length > 0 ? renderEpisodes(episodes, anime.slug) : null;
  const infoFrag = renderInfo(anime);

  const wrapper = document.createElement('div');
  wrapper.className = 'watch-container';
  wrapper.appendChild(heroFrag);
  wrapper.appendChild(playerFrag);
  if (serversFrag) wrapper.appendChild(serversFrag);
  if (episodesFrag) wrapper.appendChild(episodesFrag);
  wrapper.appendChild(infoFrag);

  container.innerHTML = '';
  container.appendChild(wrapper);

  setupLazyImages();
  bindEvents(container, data);
}

/* ───────────────────────────────────────────────────────────────
   HERO
   ─────────────────────────────────────────────────────────────── */
function renderHero(anime) {
  const backdrop = anime.backdropImage || anime.posterImage || '';
  const epBadge = anime.episodeNumber
    ? `<span class="watch-hero-badge accent"><i class="fa-solid fa-play" style="font-size:9px;margin-right:4px;"></i>Tap ${anime.episodeNumber}</span>`
    : '';
  const viewsBadge = anime.viewsTotal
    ? `<span class="watch-hero-badge outline"><i class="fa-solid fa-eye" style="font-size:9px;margin-right:4px;"></i>${formatViews(anime.viewsTotal)}</span>`
    : '';
  const yearBadge = anime.releaseYear && anime.releaseYear !== 'N/A'
    ? `<span class="watch-hero-badge outline"><i class="fa-solid fa-calendar" style="font-size:9px;margin-right:4px;"></i>${anime.releaseYear}</span>`
    : '';

  const studios = (anime.studios || []).map(s => sanitizeText(s.name)).filter(Boolean).join(', ');

  const html = `
    <section class="watch-hero" aria-label="Hero">
      <div class="watch-hero-backdrop">
        ${backdrop ? `<img class="watch-hero-backdrop-img lazy-img" data-src="${backdrop}" alt="${sanitizeText(anime.title)}" />` : ''}
        <div class="watch-hero-vignette"></div>
      </div>
      <div class="watch-hero-content">
        <div class="watch-hero-meta">
          ${epBadge}
          ${viewsBadge}
          ${yearBadge}
        </div>
        <h1 class="watch-hero-title">${sanitizeText(anime.title)}</h1>
        ${studios ? `<div class="watch-hero-studios"><i class="fa-solid fa-film" style="font-size:9px;margin-right:4px;"></i>${studios}</div>` : ''}
      </div>
    </section>
  `;
  return htmlToFragment(html);
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
          <div class="watch-player-spinner"></div>
          <div class="watch-player-loader-text">
            Dang tai player <span class="watch-player-loader-brand">HentaiZ</span>
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
        <span class="pill-icon"><i class="fa-solid fa-server"></i></span>
        <span class="pill-label">Server ${sanitizeText(srv.name)}</span>
      </button>
    `;
  }).join('');

  const html = `
    <section class="watch-servers-section" aria-label="Chon server">
      <div class="watch-servers-header">
        <span><i class="fa-solid fa-server"></i></span>
        <span>Doi Server</span>
      </div>
      <div class="watch-servers-list" role="group" aria-label="Danh sach server">
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
    const icon = isActive ? '<span class="ep-icon"><i class="fa-solid fa-play"></i></span>' : '';
    return `
      <button 
        class="episode-btn ${isActive ? 'active' : ''}" 
        data-slug="${ep.slug}"
        type="button"
        ${isActive ? 'aria-current="true"' : ''}
      >
        ${icon}
        <span class="ep-label">Tap ${ep.episodeNumber || 1}</span>
      </button>
    `;
  }).join('');

  const html = `
    <section class="watch-episodes-section" aria-label="Danh sach tap">
      <div class="watch-episodes-header">
        <span><i class="fa-solid fa-layer-group"></i> Danh Sach Tap</span>
        <span class="watch-episodes-count">(${episodes.length} tap)</span>
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
    ? `<span class="meta-badge"><i class="fa-solid fa-play" style="font-size:8px;margin-right:4px;"></i>Tap ${anime.episodeNumber}</span>`
    : '';

  const views = anime.viewsTotal
    ? `<span class="meta-item"><i class="fa-solid fa-eye" style="font-size:10px;margin-right:4px;color:var(--hz-text-muted);"></i>${formatViews(anime.viewsTotal)} luot xem</span>`
    : '';

  const year = `<span class="meta-item"><i class="fa-solid fa-calendar" style="font-size:10px;margin-right:4px;color:var(--hz-text-muted);"></i>Nam: ${sanitizeText(String(anime.releaseYear))}</span>`;
  const studioMeta = studios ? `<span class="meta-item"><i class="fa-solid fa-film" style="font-size:10px;margin-right:4px;color:var(--hz-text-muted);"></i>Studio: ${studios}</span>` : '';

  const desc = sanitizeText(anime.description) || 'Chua co mo ta cho bo phim nay.';

  const html = `
    <section class="watch-info-section" aria-label="Thong tin anime">
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
        <h4 class="watch-description-title">Mo ta noi dung</h4>
        <p class="watch-description-text">${desc}</p>
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

/* ───────────────────────────────────────────────────────────────
   LAZY IMAGES
   ─────────────────────────────────────────────────────────────── */
function setupLazyImages() {
  if (watchState.lazyObserver) watchState.lazyObserver.disconnect();
  watchState.lazyObserver = createLazyObserver((img) => {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.src = normalizeImageURL(src);
    img.removeAttribute('data-src');
    img.classList.remove('lazy-img');
    img.classList.add('lazy-loaded');
  });
  document.querySelectorAll('.watch-hero .lazy-img').forEach(img => watchState.lazyObserver.observe(img));
}

/* ───────────────────────────────────────────────────────────────
   EVENT BINDING
   ─────────────────────────────────────────────────────────────── */
function bindEvents(container, data) {
  const iframe = container.querySelector('.watch-player-frame');
  const loader = container.querySelector('.watch-player-loader');
  const serverBtns = container.querySelectorAll('.server-pill');
  const episodeBtns = container.querySelectorAll('.episode-btn');

  // Player load
  if (iframe) {
    const onLoad = () => {
      if (loader) loader.classList.add('hidden');
      iframe.classList.add('loaded');
    };
    iframe.addEventListener('load', onLoad);

    const fallbackTimer = setTimeout(() => {
      if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        iframe.classList.add('loaded');
      }
    }, 4000);

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

      serverBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

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
      <h2 class="watch-error-title">Khong Tim Thay Phim</h2>
      <p class="watch-error-message">${sanitizeText(message)}</p>
      <a href="/" class="watch-error-btn">
        <i class="fa-solid fa-chevron-left"></i>
        <span>Ve Trang Chu</span>
      </a>
    </div>
  `;
  container.innerHTML = html;
}

/* ───────────────────────────────────────────────────────────────
   POPSTATE HANDLER
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
