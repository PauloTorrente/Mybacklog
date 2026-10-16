import raw from './amiibo-games.json';
import { games, type Game, type PlatformId } from './games';

/** How the amiibo is used in a game (amiibo.life's three groups). */
export type AmiiboUse = 'figure' | 'character' | 'series';

export interface AmiiboGame {
  platform: string;
  title: string;
  /** What the amiibo does there, one feature per line (translated in scripts/amiibo-pt.json). */
  does: string[];
  /** The game writes data to the figure. */
  saves: boolean;
  use: AmiiboUse;
  /** The matching game on your shelves, if you have it or wish for it. */
  game?: Game;
}

/** amiibo.life consoles → our shelves (Wii U has no shelf). */
const SHELF: Record<string, PlatformId> = { 'Switch 2': 'switch', Switch: 'switch', '3DS': '3ds', 'New 3DS': '3ds', DS: 'ds', Wii: 'wii' };

const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^the legend of /, '')
    .replace(/\((original)\)/, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Names that differ beyond a subtitle. */
const ALIAS: Record<string, string> = {
  'tokyo mirage sessions fe encore': 'tokyo mirage sessions',
  'kid icarus uprising': 'kid icarus',
  'super smash bros for nintendo 3ds': 'super smash bros',
};

/** Games whose name is the start of a different game on the shelf (Fire Emblem Warriors ≠ … Three Hopes). */
const NOT_SAME = new Set(['fire emblem warriors']);

/**
 * Finds the shelf game for an amiibo.life title on the same console: the same name, or one that only
 * adds a subtitle or edition ("Hyrule Warriors: Definitive Edition" → "Hyrule Warriors (original)",
 * "Splatoon 3" → "Splatoon 3 + DLC"), but never another number ("Xenoblade Chronicles 3" ≠ "… Chronicles").
 */
export function matchGame(platform: string, title: string): Game | undefined {
  const shelf = SHELF[platform];
  if (!shelf) return undefined;
  const theirs = ALIAS[norm(title)] ?? norm(title);
  if (NOT_SAME.has(theirs)) return undefined;
  const mine = games.filter((g) => g.platformId === shelf);
  const exact = mine.find((g) => norm(g.title) === theirs);
  if (exact) return exact;
  const extends_ = (long: string, short: string, original: string) =>
    long.startsWith(`${short} `) && /^\s*(:|\+|-|–|deluxe|definitive|edition|for|hd|remastered|encore)/i.test(original.slice(original.toLowerCase().indexOf(short.split(' ').at(-1)!) + short.split(' ').at(-1)!.length));
  return (
    mine.filter((g) => extends_(theirs, norm(g.title), title)).sort((a, b) => b.title.length - a.title.length)[0] ??
    mine.find((g) => extends_(norm(g.title), theirs, g.title))
  );
}

type Raw = Record<string, { url: string; as: Record<AmiiboUse, { platform: string; title: string; does: string[]; saves: boolean }[]> }>;

/** Games for one amiibo: the ones on your shelves first, then by how directly the amiibo is used. */
export function amiiboGames(id: string): { url?: string; list: AmiiboGame[] } {
  const entry = (raw as Raw)[id];
  if (!entry) return { list: [] };
  const order: AmiiboUse[] = ['figure', 'character', 'series'];
  const list = order.flatMap((use) => entry.as[use].map((g) => ({ ...g, use, game: matchGame(g.platform, g.title) })));
  list.sort((a, b) => Number(!!b.game) - Number(!!a.game));
  return { url: entry.url, list };
}
