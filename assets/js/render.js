import {
  parseHomeData, extractNavigation, extractStats, extractAnnouncement,
  extractSEO, extractHero, extractLatest2D, extractLatest3D,
  extractMotion, extractStudioSpotlight, extractRandom, extractTrailer,
  extractGenres, extractStudios, extractYears
} from './parser.js';

import {
  renderHeader, renderHero, renderSection, renderSidebar,
  renderFooter, renderAnnouncement
} from './components.js';

import { createLazyObserver, normalizeImageURL } from './utils.js';

let lazyObserver = null;

/**
 * Hàm mới: Chỉ render Header, Announcement và Footer chung cho toàn trang
 */
export function renderCommonLayout(rawNodes, rawChunks) {
  const parsed = parseHomeData(rawNodes, rawChunks);
  if (!parsed) { console.error('Failed to parse layout data'); return null; }

  const { meta } = parsed;
  const seo = extractSEO(meta);
  const navigation = extractNavigation(meta);
  const announcement = extractAnnouncement(meta);

  // 1. Render Header
  if (!document.getElementById('site-header')) {
    document.body.prepend(renderHeader({ seo, navigation }));
  }

  // 2. Render Announcement (Thông báo)
  if (!document.getElementById('announcement-bar')) {
    const annFrag = renderAnnouncement(announcement);
    if (annFrag.firstElementChild) {
      document.body.insertBefore(annFrag, document.body.firstChild);
    }
  }

  // 3. Render Footer
  if (!document.getElementById('site-footer')) {
    document.body.appendChild(renderFooter({ navigation, seo }));
  }

  // Khởi tạo các sự kiện tương tác của Header/Drawer/Search/Theme
  setupUIInteractions();
  setupHeaderScroll();

  return parsed;
}

/**
 * Render đầy đủ Trang chủ
 */
export function initRender(rawNodes, rawChunks) {
  // Render layout chung trước
  const parsed = renderCommonLayout(rawNodes, rawChunks);
  if (!parsed) return;

  const { meta, payloads } = parsed;
  const seo = extractSEO(meta);
  const stats = extractStats(meta);

  const hero = extractHero(payloads);
  const latest2d = extractLatest2D(payloads);
  const latest3d = extractLatest3D(payloads);
  const motion = extractMotion(payloads);
  const spotlight = extractStudioSpotlight(payloads);
  const random = extractRandom(payloads);
  const trailer = extractTrailer(payloads);

  const genres = extractGenres(payloads);
  const studios = extractStudios(payloads);
  const years = extractYears(payloads);

  document.title = seo.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description);

  const main = document.getElementById('app-main');
  if (!main) return;

  const contentWrap = document.createElement('div');
  contentWrap.className = 'content-wrap';

  if (hero.episodes.length) contentWrap.appendChild(renderHero(hero));

  [latest2d, latest3d, motion, spotlight, random, trailer].forEach(sec => {
    if (sec.episodes.length) contentWrap.appendChild(renderSection(sec));
  });

  const sidebar = renderSidebar({ genres, studios, years, stats });
  const mainGrid = document.createElement('div');
  mainGrid.className = 'main-grid';
  mainGrid.appendChild(contentWrap);
  mainGrid.appendChild(sidebar);
  
  main.innerHTML = '';
  main.appendChild(mainGrid);

  setupLazyImages();
  setupHeroCarousel(hero.episodes.length);
}

function setupLazyImages() {
  if (lazyObserver) lazyObserver.disconnect();
  lazyObserver = createLazyObserver((img) => {
    const src = img.getAttribute('data-src');
    if (!src) return;
    img.src = normalizeImageURL(src);
    img.removeAttribute('data-src');
    img.classList.remove('lazy-img');
    img.classList.add('lazy-loaded');
  });
  document.querySelectorAll('.lazy-img').forEach(img => lazyObserver.observe(img));
}

function setupHeroCarousel(slideCount) {
  if (!slideCount) return;
  const carousel = document.getElementById('hero-carousel');
  const indicators = document.getElementById('hero-indicators');
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  if (!carousel || !indicators) return;

  let current = 0;
  let interval = null;
  const delay = 6000;

  function goTo(index) {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    current = index;
    carousel.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === current));
    indicators.querySelectorAll('.hero-indicator').forEach((d, i) => d.classList.toggle('active', i === current));
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevBtn?.addEventListener('click', () => { prev(); resetTimer(); });
  nextBtn?.addEventListener('click', () => { next(); resetTimer(); });
  indicators.querySelectorAll('.hero-indicator').forEach(dot => {
    dot.addEventListener('click', () => { goTo(Number(dot.getAttribute('data-index'))); resetTimer(); });
  });

  function startTimer() { interval = setInterval(next, delay); }
  function resetTimer() { clearInterval(interval); startTimer(); }
  startTimer();
}

function setupUIInteractions() {
  const menuToggle = document.getElementById('menu-toggle');
  const drawerClose = document.getElementById('drawer-close');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawer = document.getElementById('nav-drawer');

  function openDrawer() {
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    menuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  
  menuToggle?.onclick = openDrawer;
  drawerClose?.onclick = closeDrawer;
  drawerOverlay?.onclick = closeDrawer;

  const searchToggle = document.getElementById('search-toggle');
  const searchClose = document.getElementById('search-close');
  const searchBar = document.getElementById('search-bar');
  const searchInput = document.getElementById('search-input');
  
  searchToggle?.addEventListener('click', () => { searchBar?.classList.add('open'); searchInput?.focus(); });
  searchClose?.addEventListener('click', () => { searchBar?.classList.remove('open'); });

  const annClose = document.getElementById('announcement-close');
  const annBar = document.getElementById('announcement-bar');
  annClose?.addEventListener('click', () => annBar?.remove());

  const themeToggle = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  if (stored === 'light') document.documentElement.classList.add('light');
  
  themeToggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
}

function setupHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
