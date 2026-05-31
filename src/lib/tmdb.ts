import type { MediaType } from '../types';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdbAttribution =
  'This product uses the TMDB API but is not endorsed or certified by TMDB.';

export function tmdbPosterUrl(path?: string, size = 'w342') {
  if (!path) {
    return '';
  }

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbTitleUrl(mediaType: MediaType, tmdbId: number) {
  const path = mediaType === 'series' ? 'tv' : 'movie';
  return `https://www.themoviedb.org/${path}/${tmdbId}`;
}

export function hasTmdbToken() {
  return Boolean(import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN);
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new Error('Set VITE_TMDB_READ_ACCESS_TOKEN to use live TMDB calls.');
  }

  const url = new URL(`${TMDB_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  vote_average?: number;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

export function searchTmdb(query: string) {
  return tmdbFetch<TmdbSearchResponse>('/search/multi', {
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
}

export function getTmdbDetails(mediaType: MediaType, tmdbId: number) {
  const path = mediaType === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  return tmdbFetch<Record<string, unknown>>(path, {
    append_to_response: 'credits,external_ids',
    language: 'en-US',
  });
}
