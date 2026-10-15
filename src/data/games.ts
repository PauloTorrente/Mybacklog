import raw from './games.json';

export type PlatformId = 'switch' | '3ds' | 'ds' | 'wii' | 'ps4';

export interface Platform {
  id: PlatformId;
  name: string;
  short: string;
  /** Launch year(s), e.g. 2017 or "2013 / 2020" for a shelf that covers two consoles. */
  year: number | string;
}

export type GameStatus = 'owned' | 'wishlist';

export interface Game {
  id: string;
  title: string;
  genre: string;
  platformId: PlatformId;
  status: GameStatus;
}

interface RawExtra {
  /** Shelve the game as if it had this title (keeps companion releases side by side). */
  shelfAs?: string;
  /**
   * Release date "YYYY-MM-DD": the game stays hidden until that day.
   * Only a year ("2027") or "TBA" means no confirmed date yet: hidden until one is set.
   */
  release?: string;
}

type RawGame = [title: string, genre: string, extra?: RawExtra];

interface RawPlatform extends Platform {
  games: RawGame[];
  wishlist: RawGame[];
}

/** Lowercase, strip accents. Shared by slugs and search ("pokemon" → "Pokémon"). */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function slugify(text: string): string {
  return normalize(text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const rawPlatforms = raw.platforms as RawPlatform[];

export const platforms: Platform[] = rawPlatforms.map(({ id, name, short, year }) => ({ id, name, short, year }));

const ROMAN: Record<string, number> = {
  ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16,
};

/**
 * Shelf order: alphabetical, ignoring a leading "The", with owned and wishlist games mixed.
 * Numbers sort by value, Roman numerals included, so Dragon Quest IV, V, VI, IX come in order and before
 * "Dragon Quest Monsters". A lone "X" stays a letter (Xenoblade Chronicles X, Sonic X Shadow).
 */
export const shelfKey = (title: string) =>
  normalize(title)
    .replace(/^the /, '')
    .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|xi|xii|xiii|xiv|xv|xvi)\b/g, (r) => String(ROMAN[r]))
    .replace(/\d+/g, (n) => n.padStart(4, '0'));

/** Today as "YYYY-MM-DD" in local time, so a game shows up on its release day, not a UTC day early or late. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isReleased(release: string | undefined, on: string = today()): boolean {
  if (!release) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(release)) return false; // year only or "TBA": no date yet
  return release <= on;
}

const toShelf = (p: RawPlatform, list: RawGame[], status: GameStatus) =>
  list
    .filter(([, , extra]) => isReleased(extra?.release))
    .map(([title, genre, { shelfAs } = {}]) => ({
    game: { id: slugify(`${p.id} ${title}`), title, genre, platformId: p.id, status } satisfies Game,
    key: shelfKey(shelfAs ?? title),
  }));

export const games: Game[] = rawPlatforms.flatMap((p) =>
  [...toShelf(p, p.games, 'owned'), ...toShelf(p, p.wishlist, 'wishlist')]
    .sort((a, b) => a.key.localeCompare(b.key, 'pt'))
    .map(({ game }) => game),
);

export const platformById = new Map(platforms.map((p) => [p.id, p]));

/** A cube on the table: a console's game shelf, or the amiibo shelves. */
export type ShelfId = PlatformId | 'amiibo';

export function isPlatformId(value: string | null): value is PlatformId {
  return value !== null && platformById.has(value as PlatformId);
}

/** Count games per genre, sorted by count desc, then name. */
export function countByGenre(list: Game[]): [genre: string, count: number][] {
  const counts = new Map<string, number>();
  for (const g of list) counts.set(g.genre, (counts.get(g.genre) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt'));
}
