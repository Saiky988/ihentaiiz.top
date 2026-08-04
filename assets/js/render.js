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
 * Render shared layout: Header, Announcement, Footer, Nav
 * Used by both Home and Watch pages
 */
export function renderSharedUI(parsed) {
  if (!parsed) return;

  const { meta } = parsed;
  const seo = extractSEO(meta);
  const navigation = extractNavigation(meta);
  const announcement = extractAnnouncement(meta);

  document.title = seo.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description);

  // Prevent duplicate header
  if (!document.getElementById('site-header')) {
    document.body.prepend(renderHeader({ seo, navigation }));
  }

  // Prevent duplicate announcement
  if (!document.getElementById('announcement-bar')) {
    const annFrag = renderAnnouncement(announcement);
    if (annFrag.firstElementChild) {
      document.body.insertBefore(annFrag, document.body.firstChild);
    }
  }

  // Prevent duplicate footer
  if (!document.querySelector('.site-footer')) {
    document.body.appendChild(renderFooter({ navigation, seo }));
  }

  setupUIInteractions();
  setupHeaderScroll();
}

/**
 * Render Home page body content into #app-main
 */
export function renderHomeBody(parsed) {
  if (!parsed) return;

  const { meta, payloads } = parsed;
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

  const main = document.getElementById('app-main');
  if (!main) return;
  main.innerHTML = '';

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
  main.appendChild(mainGrid);

  setupLazyImages();
  setupHeroCarousel(hero.episodes.length);
}

/**
 * Legacy init for Home page (fetch + render everything)
 */
export function initRender(rawNodes, rawChunks) {
  const parsed = parseHomeData(rawNodes, rawChunks);
  if (!parsed) { console.error('Failed to parse'); return; }
  renderSharedUI(parsed);
  renderHomeBody(parsed);
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
  menuToggle?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

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
