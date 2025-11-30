import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const DISCOGS_API_BASE = 'https://api.discogs.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 ScrollMusicApp/1.0';
const CONSUMER_KEY = process.env.DISCOGS_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET || '';

// Создаем axios instance с нужными headers
const discogsClient = axios.create({
  baseURL: DISCOGS_API_BASE,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/vnd.discogs.v2.json'
  }
});

// Вспомогательная функция для добавления OAuth параметров
function getAuthParams() {
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    return `key=${CONSUMER_KEY}&secret=${CONSUMER_SECRET}`;
  }
  return '';
}

/**
 * Поиск релизов, артистов, и меток
 * @param {string} query - Поисковая строка
 * @param {string} type - 'release' | 'artist' | 'label' | 'all'
 * @param {number} page - Номер страницы
 * @param {number} perPage - Количество результатов на странице
 */
export async function searchDiscogs(query, type = 'release', page = 1, perPage = 20) {
  try {
    let searchParams = `query=${encodeURIComponent(query)}&type=${type}&page=${page}&per_page=${perPage}`;
    
    // Add OAuth credentials if available
    const authParams = getAuthParams();
    if (authParams) {
      searchParams += `&${authParams}`;
    }
    
    const response = await discogsClient.get(`/database/search?${searchParams}`);
    
    return {
      success: true,
      data: response.data.results || [],
      pagination: response.data.pagination || {},
      rateLimit: {
        total: response.headers['x-discogs-ratelimit'],
        used: response.headers['x-discogs-ratelimit-used'],
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs search error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to search Discogs',
      data: []
    };
  }
}

/**
 * Получить информацию об артисте
 * @param {number} artistId - ID артиста в Discogs
 */
export async function getArtist(artistId) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `?${authParams}` : '';
    const response = await discogsClient.get(`/artists/${artistId}${urlSuffix}`);
    
    return {
      success: true,
      data: response.data,
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs artist error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить релизы артиста
 * @param {number} artistId - ID артиста
 * @param {number} page - Номер страницы
 * @param {number} perPage - Количество результатов
 */
export async function getArtistReleases(artistId, page = 1, perPage = 50) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `&${authParams}` : '';
    const response = await discogsClient.get(`/artists/${artistId}/releases?page=${page}&per_page=${perPage}${urlSuffix}`);
    
    return {
      success: true,
      data: response.data.releases || [],
      pagination: response.data.pagination || {},
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs releases error:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Получить информацию о релизе
 * @param {number} releaseId - ID релиза
 */
export async function getRelease(releaseId) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `?${authParams}` : '';
    const response = await discogsClient.get(`/releases/${releaseId}${urlSuffix}`);
    
    return {
      success: true,
      data: response.data,
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs release error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить мастер-релиз (полная информация об альбоме)
 * @param {number} masterId - ID мастер-релиза
 */
export async function getMasterRelease(masterId) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `?${authParams}` : '';
    const response = await discogsClient.get(`/masters/${masterId}${urlSuffix}`);
    
    return {
      success: true,
      data: response.data,
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs master error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить версии релиза
 * @param {number} masterId - ID мастер-релиза
 * @param {number} page - Номер страницы
 */
export async function getMasterVersions(masterId, page = 1) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `&${authParams}` : '';
    const response = await discogsClient.get(`/masters/${masterId}/versions?page=${page}&per_page=50${urlSuffix}`);
    
    return {
      success: true,
      data: response.data.versions || [],
      pagination: response.data.pagination || {},
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs versions error:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Получить треклист релиза
 * @param {number} releaseId - ID релиза
 */
export async function getReleaseTracks(releaseId) {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `?${authParams}` : '';
    const response = await discogsClient.get(`/releases/${releaseId}${urlSuffix}`);
    const release = response.data;
    
    const tracks = release.tracklist ? release.tracklist.map(track => ({
      title: track.title,
      position: track.position,
      duration: track.duration,
      artists: track.artists || [],
      notes: track.notes || ''
    })) : [];
    
    return {
      success: true,
      data: {
        title: release.title,
        artist: release.artists?.[0]?.name || 'Unknown',
        year: release.year,
        tracks: tracks,
        images: release.images || []
      },
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs tracks error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Получить жанры
 */
export async function getGenres() {
  try {
    const authParams = getAuthParams();
    const urlSuffix = authParams ? `?${authParams}` : '';
    const response = await discogsClient.get(`/genres${urlSuffix}`);
    
    return {
      success: true,
      data: response.data || [],
      rateLimit: {
        remaining: response.headers['x-discogs-ratelimit-remaining']
      }
    };
  } catch (error) {
    console.error('Discogs genres error:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export default {
  searchDiscogs,
  getArtist,
  getArtistReleases,
  getRelease,
  getMasterRelease,
  getMasterVersions,
  getReleaseTracks,
  getGenres
};
