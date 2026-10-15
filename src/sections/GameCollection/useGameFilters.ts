import { useCallback, useEffect, useMemo, useState } from 'react';
import { amiibos } from '../../data/amiibo';
import { countByGenre, games as allGames, isPlatformId, platforms, type Game, type ShelfId } from '../../data/games';

/** `null` = no console picked yet: nothing is listed until the user picks a cube. */
export type PlatformFilter = ShelfId | null;

export interface Filters {
  platform: PlatformFilter;
  genres: string[];
}

export function gamesOn(platform: PlatformFilter, list: Game[] = allGames): Game[] {
  return platform === null ? [] : list.filter((g) => g.platformId === platform);
}

/** Genres are OR'd together, then AND'd with the console. */
export function filterGames({ platform, genres }: Filters, list: Game[] = allGames): Game[] {
  const genreSet = new Set(genres);
  return gamesOn(platform, list).filter((g) => genreSet.size === 0 || genreSet.has(g.genre));
}

/** Drops genres with no games on the console, so a hidden pill can never stay selected. */
function pruneGenres(platform: PlatformFilter, genres: string[]): string[] {
  const available = new Set(gamesOn(platform).map((g) => g.genre));
  return genres.filter((g) => available.has(g));
}

export function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const consoleParam = params.get('console');
  const platform: PlatformFilter = isPlatformId(consoleParam) || consoleParam === 'amiibo' ? consoleParam : null;
  const genres = (params.get('genre') ?? '').split(',').map((g) => g.trim()).filter(Boolean);
  return { platform, genres: pruneGenres(platform, [...new Set(genres)]) };
}

export function serializeFilters({ platform, genres }: Filters): string {
  const params = new URLSearchParams();
  if (platform) params.set('console', platform);
  if (genres.length) params.set('genre', genres.join(','));
  const s = params.toString();
  return s ? `?${s}` : '';
}

const readUrl = () => parseFilters(typeof window === 'undefined' ? '' : window.location.search);

export function useGameFilters() {
  const [filters, setFilters] = useState<Filters>(readUrl);

  // State → URL (replace, so clicking around doesn't flood history).
  useEffect(() => {
    const next = serializeFilters(filters);
    if (next !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${next}${window.location.hash}`);
    }
  }, [filters]);

  // URL → state for back/forward navigation.
  useEffect(() => {
    const onPop = () => setFilters(readUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setPlatform = useCallback((platform: PlatformFilter) => {
    setFilters((f) => ({ ...f, platform, genres: pruneGenres(platform, f.genres) }));
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(genre) ? f.genres.filter((g) => g !== genre) : [...f.genres, genre],
    }));
  }, []);

  /** Clears the genres but keeps the picked console. */
  const clear = useCallback(() => {
    setFilters((f) => ({ ...f, genres: [] }));
  }, []);

  const platformCounts = useMemo(
    () => new Map<ShelfId, number>([...platforms.map((p) => [p.id, gamesOn(p.id).length] as const), ['amiibo', amiibos.length]]),
    [],
  );
  const ownedCount = useMemo(() => allGames.filter((g) => g.status === 'owned').length, []);
  const wishlistCount = allGames.length - ownedCount;

  const genreOptions = useMemo(() => countByGenre(gamesOn(filters.platform)), [filters.platform]);

  const results = useMemo(() => filterGames(filters), [filters]);

  return {
    filters,
    setPlatform,
    toggleGenre,
    clear,
    platformCounts,
    ownedCount,
    wishlistCount,
    genreOptions,
    results,
  };
}
