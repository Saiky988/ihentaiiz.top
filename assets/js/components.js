import {
  formatViews, formatEpisode, truncate, sanitizeText,
  getAnimationTypeLabel, htmlToFragment
} from './utils.js';

const ACCENT = '#ff2d7d';

export function renderHeader({ seo, navigation }) {
  const drawer = navigation?.drawer || [];
  const bottom = navigation?.bottom || [];

  const drawerHTML = drawer.map(section => {
    const items = (section?.items || []).map(item => `
      <a href="${item.url || '#'}" class="nav-drawer-link" data-icon="${item.icon || ''}">
        <span class="nav-drawer-icon">${getIconSVG(item.icon)}</span>
        <span class="nav-drawer-text">${sanitizeText(item.title)}</span>
        ${item.isHot ? '<span class="badge-hot">HOT</span>' : ''}
        ${item.isNew ? '<span class="badge-new">NEW</span>' : ''}
      </a>
    `).join('');
    return `
      <div class="drawer-section">
        ${section.hideTitle ? '' : `<h3 class="drawer-section-title">${sanitizeText(section.title)}</h3>`}
        <div class="drawer-section-items">${items}</div>
      </div>
    `;
  }).join('');

  const bottomHTML = bottom.map(item => `
    <a href="${item.url || '#'}" class="bottom-nav-item" aria-label="${sanitizeText(item.title)}">
      <span class="bottom-nav-icon">${getIconSVG(item.icon)}</span>
      <span class="bottom-nav-label">${sanitizeText(item.title)}</span>
    </a>
  `).join('');

  const html = `
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <button class="menu-toggle" id="menu-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="nav-drawer">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <a href="/" class="site-logo" aria-label="${sanitizeText(seo.brandName)} Home">
          <span class="logo-text">${sanitizeText(seo.brandName)}</span>
          <span class="logo-dot">.</span>
        </a>
        <nav class="header-nav" aria-label="Main navigation">
          ${bottom.slice(0, 5).map(item => `
            <a href="${item.url || '#'}" class="header-nav-link">${sanitizeText(item.title)}</a>
          `).join('')}
        </nav>
        <div class="header-actions">
          <button class="header-btn search-toggle" id="search-toggle" aria-label="Tìm kiếm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button class="header-btn theme-toggle" id="theme-toggle" aria-label="Chuyển đổi giao diện">
            <svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <a href="/login" class="header-btn profile-btn" aria-label="Tài khoản">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
        </div>
      </div>
      <div class="search-bar" id="search-bar">
        <div class="search-inner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="search-input" placeholder="Tìm kiếm anime, studio, thể loại..." autocomplete="off" />
          <button class="search-close" id="search-close" aria-label="Đóng tìm kiếm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </header>
    <aside class="nav-drawer" id="nav-drawer" aria-hidden="true">
      <div class="drawer-overlay" id="drawer-overlay"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <a href="/" class="drawer-logo">${sanitizeText(seo.brandName)}<span style="color:${ACCENT}">.</span></a>
          <button class="drawer-close" id="drawer-close" aria-label="Đóng menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="drawer-body">${drawerHTML}</div>
      </div>
    </aside>
    <nav class="bottom-nav" aria-label="Bottom navigation">${bottomHTML}</nav>
  `;
  return htmlToFragment(html);
}

export function renderHero({ episodes, title }) {
  if (!episodes?.length) return document.createDocumentFragment();
  const slides = episodes.map((ep, idx) => {
    const studios = ep.studios.map(s => sanitizeText(s.name)).join(', ');
    const genres = ep.genres.map(g => `<span class="hero-badge hero-badge-outline">${sanitizeText(g.name)}</span>`).join('');
    const isActive = idx === 0 ? 'active' : '';
    return `
      <div class="hero-slide ${isActive}" data-index="${idx}" role="group" aria-roledescription="slide" aria-label="${idx + 1} / ${episodes.length}">
        <div class="hero-backdrop">
          <img class="hero-backdrop-img lazy-img" data-src="${ep.backdropImage || ep.posterImage}" alt="${sanitizeText(ep.title)}" />
          <div class="hero-vignette"></div>
        </div>
        <div class="hero-content">
          <div class="hero-meta">
            <span class="hero-badge">${getAnimationTypeLabel(ep.animationType)}</span>
            ${ep.episodeNumber ? `<span class="hero-badge hero-badge-outline">${formatEpisode(ep.episodeNumber)}</span>` : ''}
            <span class="hero-badge hero-badge-outline">${formatViews(ep.viewsTotal)} views</span>
          </div>
          <h2 class="hero-title">${sanitizeText(ep.title)}</h2>
          <div class="hero-meta">${genres}</div>
          <p class="hero-desc">${truncate(ep.description.replace(/<[^>]+>/g, ''), 180)}</p>
          ${studios ? `<div class="hero-studios">${studios}</div>` : ''}
          <div class="hero-actions">
            <a href="${ep.url}" class="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Xem Ngay
            </a>
            <a href="${ep.url}" class="btn btn-secondary">Thông Tin</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
  const indicators = episodes.map((_, idx) => `
    <button class="hero-indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Slide ${idx + 1}">
      <span class="indicator-progress"></span>
    </button>
  `).join('');
  const html = `
    <section class="hero-section" id="hero" aria-label="Nổi bật">
      <div class="hero-carousel" id="hero-carousel">${slides}</div>
      <div class="hero-controls">
        <button class="hero-arrow hero-prev" id="hero-prev" aria-label="Trước">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="hero-indicators" id="hero-indicators">${indicators}</div>
        <button class="hero-arrow hero-next" id="hero-next" aria-label="Tiếp">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>
  `;
  return htmlToFragment(html);
}

export function renderMovieCard(ep, { lazy = true } = {}) {
  const studios = ep.studios.map(s => sanitizeText(s.name)).join(', ');
  const imgClass = lazy ? 'lazy-img' : '';
  const imgAttr = lazy ? `data-src="${ep.posterImage}"` : `src="${ep.posterImage}"`;
  const html = `
    <article class="movie-card" data-id="${ep.id}" data-type="${ep.animationType}">
      <a href="${ep.url}" class="card-link" aria-label="${sanitizeText(ep.title)}">
        <div class="card-poster">
          <img class="card-img ${imgClass}" ${imgAttr} alt="${sanitizeText(ep.title)}" loading="lazy" />
          <div class="card-gradient"></div>
          <div class="card-badges">
            <span class="badge badge-type">${getAnimationTypeLabel(ep.animationType)}</span>
            ${ep.episodeNumber ? `<span class="badge badge-ep">${formatEpisode(ep.episodeNumber)}</span>` : ''}
          </div>
          <span class="card-play">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </span>
        </div>
        <div class="card-info">
          <h3 class="card-title">${sanitizeText(ep.title)}</h3>
          <div class="card-meta">
            <span class="card-views">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              ${formatViews(ep.viewsTotal)}
            </span>
            ${studios ? `<span class="card-studio">${truncate(studios, 24)}</span>` : ''}
          </div>
        </div>
      </a>
    </article>
  `;
  return htmlToFragment(html).firstElementChild;
}

export function renderSection({ title, episodes, viewAllUrl, key }) {
  if (!episodes?.length) return document.createDocumentFragment();
  const cards = episodes.map(ep => {
    const card = renderMovieCard(ep);
    return card?.outerHTML || '';
  }).join('');
  const html = `
    <section class="content-section" data-section="${key}" aria-label="${sanitizeText(title)}">
      <div class="section-header">
        <h2 class="section-title">${sanitizeText(title)}</h2>
        <a href="${viewAllUrl || '#'}" class="section-more">
          Xem tất cả
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>
      <div class="movie-grid" id="grid-${key}">${cards}</div>
    </section>
  `;
  return htmlToFragment(html);
}

export function renderSidebar({ genres, studios, years, stats }) {
  const genreHTML = genres.slice(0, 20).map(g => `
    <a href="/genres/${g.slug}" class="filter-chip">${sanitizeText(g.name)}</a>
  `).join('');
  const studioHTML = studios.slice(0, 16).map(s => `
    <a href="/studios/${s.slug}" class="filter-chip filter-chip-studio">${sanitizeText(s.name)}</a>
  `).join('');
  const yearHTML = years.slice(0, 10).map(y => `
    <a href="/browse?year=${y}" class="filter-chip">${y}</a>
  `).join('');
  const html = `
    <aside class="site-sidebar" id="sidebar" aria-label="Bộ lọc">
      <div class="sidebar-block">
        <h3 class="sidebar-title">Thể Loại</h3>
        <div class="filter-chips">${genreHTML}</div>
        <a href="/genres" class="sidebar-more">Xem tất cả →</a>
      </div>
      <div class="sidebar-block">
        <h3 class="sidebar-title">Hãng Phim</h3>
        <div class="filter-chips">${studioHTML}</div>
        <a href="/studios" class="sidebar-more">Xem tất cả →</a>
      </div>
      <div class="sidebar-block">
        <h3 class="sidebar-title">Năm</h3>
        <div class="filter-chips">${yearHTML}</div>
      </div>
      <div class="sidebar-block stats-block">
        <h3 class="sidebar-title">Thống Kê</h3>
        <div class="stats-grid">
          <div class="stat-item"><span class="stat-value">${(stats?.animeCount || 0).toLocaleString('vi-VN')}</span><span class="stat-label">Anime</span></div>
          <div class="stat-item"><span class="stat-value">${(stats?.commentCount || 0).toLocaleString('vi-VN')}</span><span class="stat-label">Bình luận</span></div>
          <div class="stat-item"><span class="stat-value">${(stats?.userCount || 0).toLocaleString('vi-VN')}</span><span class="stat-label">Thành viên</span></div>
        </div>
      </div>
    </aside>
  `;
  return htmlToFragment(html);
}

export function renderFooter({ navigation, seo }) {
  const footerSections = navigation?.footer || [];
  const columns = footerSections.map(section => {
    const items = (section?.items || []).map(item => `
      <a href="${item.url || '#'}" class="footer-link" target="${item.url?.startsWith('http') ? '_blank' : '_self'}" rel="${item.url?.startsWith('http') ? 'noopener noreferrer' : ''}">${sanitizeText(item.title)}</a>
    `).join('');
    return `
      <div class="footer-col">
        <h4 class="footer-col-title">${sanitizeText(section.title)}</h4>
        <nav class="footer-links" aria-label="${sanitizeText(section.title)}">${items}</nav>
      </div>
    `;
  }).join('');
  const html = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="/" class="footer-logo">${sanitizeText(seo.brandName)}<span style="color:${ACCENT}">.</span></a>
          <p class="footer-desc">${sanitizeText(seo.description).slice(0, 160)}</p>
        </div>
        <div class="footer-columns">${columns}</div>
      </div>
      <div class="footer-bottom">
        <p class="copyright">© ${new Date().getFullYear()} ${sanitizeText(seo.brandName)}. All rights reserved.</p>
        <p class="footer-18">Nội dung dành cho người trên 18 tuổi.</p>
      </div>
    </footer>
  `;
  return htmlToFragment(html);
}

export function renderAnnouncement({ enabled, html }) {
  if (!enabled || !html) return document.createDocumentFragment();
  return htmlToFragment(`
    <div class="announcement-bar" id="announcement-bar">
      <div class="announcement-inner">
        <span class="announcement-icon">📢</span>
        <span class="announcement-text">${html}</span>
        <button class="announcement-close" id="announcement-close" aria-label="Đóng">×</button>
      </div>
    </div>
  `);
}

function getIconSVG(name) {
  const icons = {
    IconHome: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    IconGift: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    IconArticle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    IconCategory2: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    IconUsersGroup: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    IconArrowsRandom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    IconSubtitlesAi: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>',
    IconChartAreaLine: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    IconUserShare: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    IconGenderFemale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><line x1="12" y1="13" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/></svg>',
    IconDeviceNintendo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4"/><path d="M15 11v2"/></svg>',
    IconAlignBoxCenterStretch: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M3 18h18"/><rect x="7" y="9" width="10" height="6" rx="1"/></svg>',
    IconFileTextShield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>',
    IconMessageCircleQuestion: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    IconChartBarPopular: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    IconBadgeTm: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0m-2.23 5.77c-1.19-2.42-2.8-4.5-5.2-5.86"/></svg>',
    IconPaw: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.995 6 15C5.998 13.042 6.846 11.25 9 10z"/><circle cx="9" cy="20" r="2"/><circle cx="6" cy="16" r="2"/></svg>',
    IconProtocol: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    IconLock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    IconCongruentTo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9h14"/><path d="M5 15h14"/></svg>',
    IconAd: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    IconReport: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    IconClover: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16.17 7.83 19.07 4.93a1 1 0 0 0-1.42-1.42L14.76 6.4a4 4 0 0 0-5.52 0L6.35 3.51a1 1 0 0 0-1.42 1.42l2.9 2.9a4 4 0 0 0 0 5.52l-2.9 2.9a1 1 0 0 0 1.42 1.42l2.89-2.89a4 4 0 0 0 5.52 0l2.89 2.89a1 1 0 0 0 1.42-1.42l-2.9-2.9a4 4 0 0 0 0-5.52z"/><circle cx="12" cy="12" r="1"/></svg>',
    IconBrandSafari: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    IconBrandDiscord: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0"/><path d="M14 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0"/><path d="M15.5 17c0 1 1.5 2 1.5 2s1.5-1 1.5-2"/><path d="M8.5 17c0 1-1.5 2-1.5 2s-1.5-1-1.5-2"/><path d="M6.5 8c0-1 1.5-2 1.5-2s1.5 1 1.5 2"/><path d="M17.5 8c0-1-1.5-2-1.5-2s-1.5 1-1.5 2"/><path d="M7.5 8c0-1 1.5-2 1.5-2s1.5 1 1.5 2"/><path d="M7.5 16c0 1 1.5 2 1.5 2s1.5-1 1.5-2"/><path d="M16.5 16c0 1-1.5 2-1.5 2s-1.5-1-1.5-2"/></svg>'
  };
  return icons[name] || icons['IconHome'];
}
