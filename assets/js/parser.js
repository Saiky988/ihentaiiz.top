/**
 * HentaiZ Frontend - Parser & Extractors
 * Handles SvelteKit __data.json format with references
 */

import {
  resolveRefs,
  normalizeImageURL,
  getSectionTitle
} from './utils.js';

/**
 * Parses raw SvelteKit __data.json response
 */
export function parseHomeData(rawNodes, rawChunks = []) {
  if (!Array.isArray(rawNodes) || rawNodes.length < 3) {
    console.error('Invalid nodes array');
    return null;
  }

  // Node 0: skip
  // Node 1: site metadata
  // Node 2: sections + payloads

  const metaNode = rawNodes[1];
  const sectionsNode = rawNodes[2];

  const metaData = metaNode?.data || [];
  const sectionsData = sectionsNode?.data || [];

  const meta = resolveRefs(metaData, 0);
  const sectionsRoot = resolveRefs(sectionsData, 0);

  // Merge chunk data into payloads
  const chunks = new Map();
  for (const chunk of rawChunks) {
    if (chunk?.id != null && chunk?.data) {
      chunks.set(String(chunk.id), resolveRefs(chunk.data, 0));
    }
  }

  const payloads = sectionsRoot?.payloads || [];
  const enrichedPayloads = payloads.map((p, idx) => {
    const key = p?.key;
    // Some payloads reference chunks via promise
    if (p?.promise && Array.isArray(p.promise)) {
      const chunkId = String(idx + 1); // chunks are 1-indexed in this dataset
      const chunk = chunks.get(chunkId);
      if (chunk) {
        return { ...p, ...chunk, key };
      }
    }
    return p;
  });

  return {
    meta,
    sections: sectionsRoot?.sections || [],
    payloads: enrichedPayloads
  };
}

/**
 * Extracts navigation sections
 */
export function extractNavigation(meta) {
  const nav = meta?.navigation || {};
  return {
    drawer: Array.isArray(nav.drawer) ? nav.drawer : [],
    footer: Array.isArray(nav.footer) ? nav.footer : [],
    bottom: Array.isArray(nav.bottom) ? nav.bottom : []
  };
}

/**
 * Extracts site stats
 */
export function extractStats(meta) {
  const s = meta?.stats || {};
  return {
    animeCount: s.animeCount ?? 0,
    commentCount: s.commentCount ?? 0,
    userCount: s.userCount ?? 0
  };
}

/**
 * Extracts announcement
 */
export function extractAnnouncement(meta) {
  const a = meta?.announcement || {};
  return {
    enabled: !!a.announcementEnabled,
    html: a.announcementHtml || ''
  };
}

/**
 * Extracts SEO data
 */
export function extractSEO(meta) {
  return {
    title: meta?.seoTitle || 'HentaiZ',
    description: meta?.seoDescription || '',
    brandName: meta?.seoBrandName || 'HentaiZ',
    siteOrigin: meta?.siteOrigin || 'https://hentaiz1.com',
    domainHostname: meta?.domainHostname || 'hentaiz1.com',
    currentPath: meta?.currentPath || '/'
  };
}

/**
 * Extracts ad context
 */
export function extractAdContext(meta) {
  return meta?.adContext || {};
}

/**
 * Extracts hero/featured episodes
 */
export function extractHero(payloads) {
  const payload = payloads?.find(p => p?.key === 'HERO');
  const episodes = payload?.featuredEpisodes || payload?.episodes || [];
  return {
    key: 'HERO',
    title: getSectionTitle('HERO', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/'
  };
}

/**
 * Extracts latest 2D episodes
 */
export function extractLatest2D(payloads) {
  const payload = payloads?.find(p => p?.key === 'LATEST_2D');
  const episodes = payload?.episodes || [];
  return {
    key: 'LATEST_2D',
    title: getSectionTitle('LATEST_2D', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/browse/2d'
  };
}

/**
 * Extracts latest 3D episodes
 */
export function extractLatest3D(payloads) {
  const payload = payloads?.find(p => p?.key === 'LATEST_3D');
  const episodes = payload?.episodes || [];
  return {
    key: 'LATEST_3D',
    title: getSectionTitle('LATEST_3D', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/browse/3d'
  };
}

/**
 * Extracts motion episodes
 */
export function extractMotion(payloads) {
  const payload = payloads?.find(p => p?.key === 'MOTION');
  const episodes = payload?.episodes || [];
  return {
    key: 'MOTION',
    title: getSectionTitle('MOTION', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/browse/motion'
  };
}

/**
 * Extracts studio spotlight
 */
export function extractStudioSpotlight(payloads) {
  const payload = payloads?.find(p => p?.key === 'STUDIO_SPOTLIGHT');
  const episodes = payload?.episodes || [];
  return {
    key: 'STUDIO_SPOTLIGHT',
    title: getSectionTitle('STUDIO_SPOTLIGHT', payload?.titleOverride),
    studioName: payload?.studioName || '',
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/browse'
  };
}

/**
 * Extracts random episodes
 */
export function extractRandom(payloads) {
  const payload = payloads?.find(p => p?.key === 'RANDOM');
  const episodes = payload?.episodes || [];
  return {
    key: 'RANDOM',
    title: getSectionTitle('RANDOM', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/random'
  };
}

/**
 * Extracts trailer episodes
 */
export function extractTrailer(payloads) {
  const payload = payloads?.find(p => p?.key === 'TRAILER');
  const episodes = payload?.episodes || payload?.featuredEpisodes || [];
  return {
    key: 'TRAILER',
    title: getSectionTitle('TRAILER', payload?.titleOverride),
    episodes: episodes.map(normalizeEpisode).filter(Boolean),
    viewAllUrl: payload?.viewAllUrl || '/browse/trailer'
  };
}

/**
 * Extracts all genres from all episodes
 */
export function extractGenres(payloads) {
  const genreMap = new Map();
  for (const payload of payloads || []) {
    const episodes = payload?.episodes || payload?.featuredEpisodes || [];
    for (const ep of episodes) {
      const genres = ep?.genres || [];
      for (const g of genres) {
        const genre = g?.genre || g;
        if (genre?.slug && genre?.name) {
          genreMap.set(genre.slug, genre);
        }
      }
    }
  }
  return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extracts all studios from all episodes
 */
export function extractStudios(payloads) {
  const studioMap = new Map();
  for (const payload of payloads || []) {
    const episodes = payload?.episodes || payload?.featuredEpisodes || [];
    for (const ep of episodes) {
      const studios = ep?.studios || [];
      for (const s of studios) {
        const studio = s?.studio || s;
        if (studio?.slug && studio?.name) {
          studioMap.set(studio.slug, studio);
        }
      }
    }
  }
  return Array.from(studioMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extracts years from episodes
 */
export function extractYears(payloads) {
  const years = new Set();
  for (const payload of payloads || []) {
    const episodes = payload?.episodes || payload?.featuredEpisodes || [];
    for (const ep of episodes) {
      if (ep?.releaseYear) years.add(ep.releaseYear);
    }
  }
  return Array.from(years).filter(Boolean).sort((a, b) => b - a);
}

/**
 * Normalizes a single episode object
 */
function normalizeEpisode(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const studios = (raw.studios || []).map(s => {
    const st = s?.studio || s;
    return { name: st?.name || '', slug: st?.slug || '' };
  }).filter(s => s.name);

  const genres = (raw.genres || []).map(g => {
    const ge = g?.genre || g;
    return { name: ge?.name || '', slug: ge?.slug || '' };
  }).filter(g => g.name);

  return {
    id: raw.id || '',
    title: raw.title || 'Unknown',
    slug: raw.slug || '',
    episodeNumber: raw.episodeNumber ?? null,
    duration: raw.duration ?? null,
    animationType: raw.animationType || 'TWO_D',
    posterImage: normalizeImageURL(raw.posterImage?.filePath || raw.posterImage),
    backdropImage: normalizeImageURL(raw.backdropImage?.filePath || raw.backdropImage),
    studios,
    description: raw.description || '',
    releaseYear: raw.releaseYear ?? null,
    viewsTotal: raw.viewsTotal ?? 0,
    genres,
    url: `/watch/${raw.slug || raw.id}`
  };
}
