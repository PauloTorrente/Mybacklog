import { describe, expect, it } from 'vitest';
import { countByGenre, games, isReleased, platforms } from './games';
import { filterGames, gamesOn, parseFilters, serializeFilters, type Filters } from '../sections/GameCollection/useGameFilters';

const base: Filters = { platform: null, genres: [] };
const owned = games.filter((g) => g.status === 'owned');

describe('games data', () => {
  it('has 102 owned games split 49 / 14 / 0 / 22 / 17 (no physical DS games)', () => {
    expect(owned).toHaveLength(102);
    expect(platforms.map((p) => owned.filter((g) => g.platformId === p.id).length)).toEqual([49, 14, 0, 22, 17]);
  });

  it('has 141 wishlist games (34 Switch, 35 3DS, the whole DS shelf, 24 Wii, 7 PlayStation), mixed into the console lists', () => {
    const wish = games.filter((g) => g.status === 'wishlist');
    expect(platforms.map((p) => wish.filter((g) => g.platformId === p.id).length)).toEqual([34, 35, 41, 24, 7]);
    expect(gamesOn('switch')).toHaveLength(83);
    expect(gamesOn('ds')).toHaveLength(41);
  });

  it('has unique slug ids (a game is never both owned and wished)', () => {
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
  });

  it('matches the owned genre totals', () => {
    expect(countByGenre(owned).slice(0, 3)).toEqual([['RPG', 56], ['Aventura', 9], ['Plataforma', 9]]);
  });
});

describe('filterGames', () => {
  it('lists nothing until a console is picked', () => {
    expect(filterGames(base)).toEqual([]);
  });

  it('DS + RPG', () => {
    expect(filterGames({ ...base, platform: 'ds', genres: ['RPG'] }).every((g) => g.platformId === 'ds' && g.genre === 'RPG')).toBe(true);
  });

  it('ORs multiple genres', () => {
    expect(filterGames({ ...base, platform: 'switch', genres: ['Luta', 'Musou'] })).toHaveLength(8);
  });
});

describe('URL sync', () => {
  it('round-trips filters', () => {
    const f: Filters = { platform: 'switch', genres: ['RPG', 'Luta'] };
    expect(parseFilters(serializeFilters(f))).toEqual(f);
  });

  it('drops unknown consoles and genres missing on that console', () => {
    expect(parseFilters('?console=n64&genre=RPG')).toEqual(base);
    expect(parseFilters('?console=ps4&genre=Pesca,Aventura')).toEqual({ ...base, platform: 'ps4', genres: ['Aventura'] });
  });
});

describe('shelf order', () => {
  it('shelves NIS Classics Vol. 3 right after Rhapsody', () => {
    const titles = gamesOn('switch').map((g) => g.title);
    expect(titles[titles.indexOf('Rhapsody: Marl Kingdom Chronicles') + 1]).toBe('NIS Classics Vol. 3');
  });
});

describe('release dates', () => {
  it('hides a game until its release day, and while it has no exact date', () => {
    expect(isReleased(undefined, '2026-10-14')).toBe(true);
    expect(isReleased('2026-09-15', '2026-10-14')).toBe(true);
    expect(isReleased('2026-10-14', '2026-10-14')).toBe(true);
    expect(isReleased('2026-10-15', '2026-10-14')).toBe(false);
    expect(isReleased('2027', '2026-10-14')).toBe(false);
    expect(isReleased('TBA', '2026-10-14')).toBe(false);
  });

  it('keeps Decapolice off the shelf until it has a date', () => {
    expect(games.some((g) => g.title === 'Decapolice')).toBe(false);
  });
});

describe('series order', () => {
  const run = (platform: 'switch' | '3ds' | 'ds' | 'wii', prefix: string) =>
    gamesOn(platform).map((g) => g.title).filter((t) => t.startsWith(prefix));

  it('keeps Dragon Quest in number order, before the spin-offs', () => {
    expect(run('ds', 'Dragon Quest')).toEqual([
      'Dragon Quest IV', 'Dragon Quest V', 'Dragon Quest VI', 'Dragon Quest IX',
      'Dragon Quest Monsters: Joker', 'Dragon Quest Monsters: Joker 2',
    ]);
    expect(run('switch', 'Dragon Quest')).toEqual(['Dragon Quest I & II', 'Dragon Quest III', 'Dragon Quest XI S']);
  });

  it('shelves DS Pokémon by generation and release, spin-offs last', () => {
    expect(run('ds', 'Pokémon')).toEqual([
      'Pokémon Platinum', 'Pokémon SoulSilver', 'Pokémon Edición Negra', 'Pokémon White 2',
      'Pokémon Ranger: Sombras de Almia', 'Pokémon Conquest',
    ]);
  });

  it('shelves 3DS Pokémon by generation and release, spin-off last', () => {
    expect(run('3ds', 'Pokémon')).toEqual([
      'Pokémon X', 'Pokémon Omega Ruby', 'Pokémon Sun', 'Pokémon Ultra Sun', 'Pokémon Super Mystery Dungeon',
    ]);
  });

  it('keeps Fire Emblem in release order, Conquest left of Birthright so the spines match', () => {
    expect(run('3ds', 'Fire Emblem')).toEqual([
      'Fire Emblem Awakening', 'Fire Emblem Fates: Conquest', 'Fire Emblem Fates: Birthright',
      'Fire Emblem Echoes: Shadows of Valentia',
    ]);
    expect(run('switch', 'Fire Emblem')).toEqual([
      'Fire Emblem: Three Houses', 'Fire Emblem Warriors: Three Hopes', 'Fire Emblem Engage', "Fire Emblem: Fortune's Weave",
    ]);
  });

  it('shelves Zelda in the official timeline order', () => {
    expect(run('3ds', 'Zelda')).toEqual([
      'Zelda: Ocarina of Time', "Zelda: Majora's Mask", 'Zelda: A Link Between Worlds', 'Zelda: Tri Force Heroes',
    ]);
    expect(run('switch', 'Zelda')).toEqual([
      "Zelda: Link's Awakening", 'Zelda: Echoes of Wisdom', 'Zelda: Breath of the Wild', 'Zelda: Tears of the Kingdom',
    ]);
  });

  it('shelves the Wii series in release order', () => {
    expect(run('wii', 'Trauma Center')).toEqual(['Trauma Center: Second Opinion', 'Trauma Center: New Blood']);
    expect(run('wii', 'Sonic')).toEqual(['Sonic Unleashed', 'Sonic and the Black Knight', 'Sonic Colors']);
    expect(run('wii', 'Super Mario Galaxy')).toEqual(['Super Mario Galaxy', 'Super Mario Galaxy 2']);
    expect(run('wii', 'Zelda')).toEqual(['Zelda: Skyward Sword', 'Zelda: Twilight Princess']);
    expect(run('wii', 'Metroid')).toEqual(['Metroid Prime 3: Corruption', 'Metroid: Other M']);
    expect(run('wii', 'Marvel')).toEqual(['Marvel Ultimate Alliance', 'Marvel Ultimate Alliance 2']);
  });
});
