/**
 * HentaiZ Frontend - Utilities
 * Production-ready vanilla JS helpers
 */

const SITE_ORIGIN = 'https://hentaiz1.com';
const CDN_ORIGIN = 'https://storage.haiten.org';

/**
 * Safely resolves SvelteKit data references
 */
export function resolveRefs(data, ref) {
  if (ref === null || ref === undefined) return ref;
  if (typeof ref === 'number' && ref >= 0 && ref < data.length) {
    const val = data[ref];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const result = {};
      for (const [k, v] of Object.entries(val)) {
        result[k] = resolveRefs(data, v);
      }
      return result;
    }
    if (Array.isArray(val)) {
      return val.map(item => resolveRefs(data, item));
    }
    return val;
  }
  if (Array.isArray(ref)) {
    return ref.map(item => resolveRefs(data, item));
  }
  if (typeof ref === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(ref)) {
      result[k] = resolveRefs(data, v);
    }
    return result;
  }
  return ref;
}

/**
 * Decodes common HTML entities
 */
export function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * Strips unsafe HTML tags, keeps basic formatting
 */
export function stripUnsafeHTML(str) {
  if (typeof str !== 'string') return '';
  const allowed = new Set(['BR', 'P', 'STRONG', 'B', 'EM', 'I', 'SPAN', 'CODE']);
  const div = document.createElement('div');
  div.innerHTML = str;
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT);
  const toRemove = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!allowed.has(node.tagName)) {
      toRemove.push(node);
    }
  }
  toRemove.forEach(n => {
    const parent = n.parentNode;
    while (n.firstChild) parent.insertBefore(n.firstChild, n);
    parent.removeChild(n);
  });
  return div.innerHTML;
}

/**
 * Sanitizes text for safe rendering
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/&(?!(amp|lt|gt|quot|apos|nbsp);)/g, '&amp;')
    .trim();
}

/**
 * Normalizes image URL to absolute
 */
export function normalizeImageURL(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return CDN_ORIGIN + url;
}

/**
 * Formats view counts (e.g. 560026 -> 560K)
 */
export function formatViews(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const n = Number(num);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

/**
 * Formats generic numbers
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('vi-VN');
}

/**
 * Formats episode label
 */
export function formatEpisode(ep) {
  if (ep === null || ep === undefined) return '??';
  return `Tập ${ep}`;
}

/**
 * Truncates string with ellipsis
 */
export function truncate(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + '…';
}

/**
 * Creates URL-friendly slug
 */
export function slugify(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Debounce utility
 */
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

/**
 * Throttle utility
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Creates a DocumentFragment from HTML string
 */
export function htmlToFragment(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Lazy image observer
 */
export function createLazyObserver(callback) {
  if (!('IntersectionObserver' in window)) {
    return { observe: (el) => callback(el), disconnect: () => {} };
  }
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });
}

/**
 * Detects if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animation type label map
 */
export function getAnimationTypeLabel(type) {
  const map = {
    'TWO_D': '2D',
    'THREE_D': '3D',
    'MOTION': 'Motion'
  };
  return map[type] || type;
}

/**
 * Section title map
 */
export function getSectionTitle(key, override) {
  if (override) return override;
  const map = {
    'HERO': 'Nổi Bật',
    'LATEST_2D': 'Anime 2D Mới',
    'LATEST_3D': 'Anime 3D Mới',
    'MOTION': 'Motion',
    'STUDIO_SPOTLIGHT': 'Studio Tiêu Biểu',
    'RANDOM': 'Ngẫu Nhiên',
    'TRAILER': 'Trailer'
  };
  return map[key] || key;
}
