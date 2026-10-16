import { games, type Game } from './games';

/**
 * Console games each amiibo character appears in (not what the amiibo unlocks), oldest first.
 * Main-series and crossover console games only: no mobile or gacha titles (Fire Emblem Heroes,
 * Brave Exvius…). Edit freely; titles that match a game on your shelves become links.
 */
type Appearance = [title: string, year: number];

const SMASH_64: Appearance = ['Super Smash Bros. (Nintendo 64)', 1999];
const MELEE: Appearance = ['Super Smash Bros. Melee', 2001];
const BRAWL: Appearance = ['Super Smash Bros. Brawl', 2008];
const SMASH_4: Appearance = ['Super Smash Bros. for Nintendo 3DS and Wii U', 2014];
const ULTIMATE: Appearance = ['Super Smash Bros. Ultimate', 2018];
const FE_WARRIORS: Appearance = ['Fire Emblem Warriors', 2017];
const ENGAGE: Appearance = ['Fire Emblem Engage', 2023];

const ZELDA_BOTW: Appearance[] = [
  ['The Legend of Zelda: Breath of the Wild', 2017],
  ['Hyrule Warriors: Age of Calamity', 2020],
  ['The Legend of Zelda: Tears of the Kingdom', 2023],
  ['Hyrule Warriors: Age of Imprisonment', 2025],
];
const SAMUS: Appearance[] = [
  ['Metroid', 1986],
  ['Metroid II: Return of Samus', 1991],
  ['Super Metroid', 1994],
  SMASH_64,
  MELEE,
  ['Metroid Fusion', 2002],
  ['Metroid Prime', 2002],
  ['Metroid: Zero Mission', 2004],
  ['Metroid Prime 2: Echoes', 2004],
  ['Metroid Prime Hunters', 2006],
  ['Metroid Prime 3: Corruption', 2007],
  BRAWL,
  ['Metroid: Other M', 2010],
  SMASH_4,
  ['Metroid: Samus Returns', 2017],
  ULTIMATE,
  ['Metroid Dread', 2021],
  ['Metroid Prime Remastered', 2023],
  ['Metroid Prime 4: Beyond', 2025],
];
const ROSALINA: Appearance[] = [
  ['Super Mario Galaxy', 2007],
  ['Mario Kart Wii', 2008],
  ['Super Mario Galaxy 2', 2010],
  ['Mario Kart 7', 2011],
  ['Super Mario 3D World', 2013],
  SMASH_4,
  ['Mario Kart 8 Deluxe', 2017],
  ULTIMATE,
  ['Super Mario Party', 2018],
  ['Mario Kart World', 2025],
];
const DAISY: Appearance[] = [
  ['Super Mario Land', 1989],
  ['Mario Tennis', 2000],
  ['Mario Kart: Double Dash!!', 2003],
  ['Mario Strikers Charged', 2007],
  ['Mario Party 8', 2007],
  ['Mario Kart Wii', 2008],
  ['Mario Sports Mix', 2010],
  ['Mario Kart 8 Deluxe', 2017],
  ULTIMATE,
  ['Super Mario Party', 2018],
  ['Super Mario Bros. Wonder', 2023],
  ['Mario Kart World', 2025],
];
const INKLING: Appearance[] = [
  ['Splatoon', 2015],
  ['Splatoon 2', 2017],
  ['Mario Kart 8 Deluxe', 2017],
  ULTIMATE,
  ['Splatoon 3', 2022],
];
const MARINA: Appearance[] = [
  ['Splatoon 2', 2017],
  ['Splatoon 2: Octo Expansion', 2018],
  ['Splatoon 3', 2022],
  ['Splatoon 3: Side Order', 2024],
];
const CORRIN: Appearance[] = [['Fire Emblem Fates', 2015], SMASH_4, FE_WARRIORS, ULTIMATE, ENGAGE];
const PYRA_MYTHRA: Appearance[] = [['Xenoblade Chronicles 2', 2017], ULTIMATE, ['Xenoblade Chronicles 3', 2022]];
const RATHALOS: Appearance[] = [
  ['Monster Hunter', 2004],
  ['Monster Hunter Tri', 2009],
  ['Monster Hunter 3 Ultimate', 2011],
  ['Monster Hunter 4 Ultimate', 2013],
  ['Monster Hunter Stories', 2016],
  ['Monster Hunter Generations Ultimate', 2017],
  ['Monster Hunter: World', 2018],
  ULTIMATE,
  ['Monster Hunter Rise', 2021],
  ['Monster Hunter Stories 2: Wings of Ruin', 2021],
  ['Monster Hunter Wilds', 2025],
];

/** amiibo id → games the character appears in. */
const BY_AMIIBO: Record<string, Appearance[]> = {
  marth: [
    ['Fire Emblem: Shadow Dragon and the Blade of Light', 1990],
    ['Fire Emblem: Mystery of the Emblem', 1994],
    MELEE,
    BRAWL,
    ['Fire Emblem: Shadow Dragon', 2008],
    ['Fire Emblem: New Mystery of the Emblem', 2010],
    SMASH_4,
    ['Tokyo Mirage Sessions ♯FE', 2015],
    FE_WARRIORS,
    ULTIMATE,
    ENGAGE,
  ],
  tiki: [
    ['Fire Emblem: Shadow Dragon and the Blade of Light', 1990],
    ['Fire Emblem: Mystery of the Emblem', 1994],
    ['Fire Emblem: Shadow Dragon', 2008],
    ['Fire Emblem: New Mystery of the Emblem', 2010],
    ['Fire Emblem Awakening', 2012],
    ['Tokyo Mirage Sessions ♯FE', 2015],
    ENGAGE,
  ],
  alm: [['Fire Emblem Gaiden', 1992], ['Fire Emblem Echoes: Shadows of Valentia', 2017]],
  celica: [['Fire Emblem Gaiden', 1992], ['Fire Emblem Echoes: Shadows of Valentia', 2017], ENGAGE],
  roy: [MELEE, ['Fire Emblem: The Binding Blade', 2002], SMASH_4, ULTIMATE, ENGAGE],
  ike: [['Fire Emblem: Path of Radiance', 2005], ['Fire Emblem: Radiant Dawn', 2007], BRAWL, SMASH_4, ULTIMATE, ENGAGE],
  chrom: [['Fire Emblem Awakening', 2012], ['Project X Zone 2', 2015], ['Tokyo Mirage Sessions ♯FE', 2015], FE_WARRIORS, ULTIMATE, ENGAGE],
  'chrom-smash': [['Fire Emblem Awakening', 2012], ['Project X Zone 2', 2015], ['Tokyo Mirage Sessions ♯FE', 2015], FE_WARRIORS, ULTIMATE, ENGAGE],
  robin: [['Fire Emblem Awakening', 2012], SMASH_4, FE_WARRIORS, ULTIMATE, ENGAGE],
  lucina: [['Fire Emblem Awakening', 2012], SMASH_4, ['Project X Zone 2', 2015], FE_WARRIORS, ULTIMATE, ENGAGE],
  corrin: CORRIN,
  'corrin-female': CORRIN,
  byleth: [ULTIMATE, ['Fire Emblem: Three Houses', 2019], ['Fire Emblem Warriors: Three Hopes', 2022], ENGAGE],

  shulk: [['Xenoblade Chronicles', 2010], SMASH_4, ULTIMATE, ['Xenoblade Chronicles 3', 2022]],
  pyra: PYRA_MYTHRA,
  mythra: PYRA_MYTHRA,
  noah: [['Xenoblade Chronicles 3', 2022]],
  mio: [['Xenoblade Chronicles 3', 2022]],

  cloud: [
    ['Final Fantasy VII', 1997],
    ['Kingdom Hearts', 2002],
    ['Kingdom Hearts II', 2005],
    ['Crisis Core: Final Fantasy VII', 2007],
    ['Dissidia Final Fantasy', 2008],
    SMASH_4,
    ['Dissidia Final Fantasy NT', 2018],
    ULTIMATE,
    ['Final Fantasy VII Remake', 2020],
    ['Final Fantasy VII Rebirth', 2024],
  ],
  sephiroth: [
    ['Final Fantasy VII', 1997],
    ['Kingdom Hearts', 2002],
    ['Kingdom Hearts II', 2005],
    ['Crisis Core: Final Fantasy VII', 2007],
    ['Dissidia Final Fantasy', 2008],
    ['Dissidia Final Fantasy NT', 2018],
    ULTIMATE,
    ['Final Fantasy VII Remake', 2020],
    ['Final Fantasy VII Rebirth', 2024],
  ],
  joker: [
    ['Persona 5', 2016],
    ['Persona Q2: New Cinema Labyrinth', 2018],
    ULTIMATE,
    ['Persona 5 Royal', 2019],
    ['Persona 5 Strikers', 2020],
    ['Persona 5 Tactica', 2023],
  ],
  hero: [['Dragon Quest XI', 2017], ULTIMATE, ['Dragon Quest XI S', 2019]],
  mewtwo: [['Pokémon Red and Blue', 1996], SMASH_64, MELEE, ['Pokémon X and Y', 2013], SMASH_4, ['Pokkén Tournament', 2015], ULTIMATE],
  'pokemon-trainer': [
    ['Pokémon Red and Blue', 1996],
    ['Pokémon Gold and Silver', 1999],
    ['Pokémon FireRed and LeafGreen', 2004],
    BRAWL,
    ['Pokémon HeartGold and SoulSilver', 2009],
    ['Pokémon Sun and Moon', 2016],
    ULTIMATE,
  ],
  richter: [
    ['Castlevania: Rondo of Blood', 1993],
    ['Castlevania: Symphony of the Night', 1997],
    ['Castlevania Judgment', 2008],
    ULTIMATE,
  ],

  'zelda-loftwing': [['The Legend of Zelda: Skyward Sword', 2011], ['The Legend of Zelda: Skyward Sword HD', 2021]],
  'link-ocarina': [['The Legend of Zelda: Ocarina of Time (Nintendo 64)', 1998], SMASH_64, MELEE, ['The Legend of Zelda: Ocarina of Time 3D', 2011]],
  'zelda-botw': ZELDA_BOTW,
  'zelda-totk': ZELDA_BOTW,
  urbosa: [['The Legend of Zelda: Breath of the Wild', 2017], ['Hyrule Warriors: Age of Calamity', 2020]],
  riju: [['The Legend of Zelda: Breath of the Wild', 2017], ['Hyrule Warriors: Age of Calamity', 2020], ['The Legend of Zelda: Tears of the Kingdom', 2023]],

  'inkling-girl': INKLING,
  'inkling-boy': INKLING,
  marina: MARINA,
  'marina-side-order': MARINA,

  magnamalo: [['Monster Hunter Rise', 2021], ['Monster Hunter Stories 2: Wings of Ruin', 2021]],
  ratha: RATHALOS,
  ena: [['Monster Hunter Stories 2: Wings of Ruin', 2021]],

  ryu: [
    ['Street Fighter', 1987],
    ['Street Fighter II', 1991],
    ['Street Fighter Alpha', 1995],
    ['Street Fighter III', 1997],
    ['Marvel vs. Capcom', 1998],
    ['Street Fighter IV', 2008],
    ['Tatsunoko vs. Capcom: Ultimate All-Stars', 2008],
    ['Project X Zone', 2012],
    SMASH_4,
    ['Street Fighter V', 2016],
    ULTIMATE,
    ['Street Fighter 6', 2023],
  ],
  ken: [
    ['Street Fighter', 1987],
    ['Street Fighter II', 1991],
    ['Street Fighter Alpha', 1995],
    ['Street Fighter III', 1997],
    ['Street Fighter IV', 2008],
    ['Project X Zone 2', 2015],
    ['Street Fighter V', 2016],
    ULTIMATE,
    ['Street Fighter 6', 2023],
  ],
  kimberly: [['Street Fighter 6', 2023]],
  'mega-man': [
    ['Mega Man', 1987],
    ['Mega Man 2', 1988],
    ['Mega Man 3', 1990],
    ['Marvel vs. Capcom', 1998],
    ['Mega Man 9', 2008],
    ['Mega Man 10', 2010],
    SMASH_4,
    ['Mega Man 11', 2018],
    ULTIMATE,
  ],
  'proto-man': [['Mega Man 3', 1990], ['Mega Man 5', 1992], ['Mega Man 7', 1995], ['Mega Man 10', 2010]],

  daisy: DAISY,
  'daisy-smash': DAISY,
  rosalina: ROSALINA,
  'rosalina-lumas': ROSALINA,
  'rosalina-smash': ROSALINA,
  palutena: [['Kid Icarus (NES)', 1986], ['Kid Icarus: Uprising', 2012], SMASH_4, ULTIMATE],
  'bayonetta-p2': [['Bayonetta', 2009], ['Bayonetta 2', 2014], SMASH_4, ULTIMATE, ['Bayonetta 3', 2022]],

  'samus-returns': SAMUS,
  'samus-metroid-suit': SAMUS,
  'samus-prime-4': SAMUS,
  'samus-vi-o-la': SAMUS,
};

const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^the legend of /, '')
    .replace(/\((original)\)|\+ dlc/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Wiki titles → how the game is named on the shelves. */
const SHELF_NAME: Record<string, string> = {
  'super smash bros for nintendo 3ds and wii u': 'super smash bros',
  'tokyo mirage sessions fe': 'tokyo mirage sessions',
  'kid icarus uprising': 'kid icarus',
  'crisis core final fantasy vii': 'crisis core',
  'mario strikers charged': 'mario strikers charged football',
  'metroid prime 4 beyond': 'metroid prime 4',
  'monster hunter stories 2 wings of ruin': 'monster hunter stories 2',
  'pokemon x and y': 'pokemon x',
  'pokemon heartgold and soulsilver': 'pokemon soulsilver',
  'pokemon sun and moon': 'pokemon sun',
  'fire emblem fates': 'fire emblem fates conquest',
  'zelda ocarina of time 3d': 'ocarina of time',
};

const shelf = new Map<string, Game[]>();
for (const g of games) {
  const k = norm(g.title.replace(/^Zelda: /, ''));
  shelf.set(k, [...(shelf.get(k) ?? []), g]);
}

/** A game on the shelves with that title, preferring one you own. */
function onShelf(title: string): Game | undefined {
  const k = norm(title);
  const found = shelf.get(SHELF_NAME[k] ?? k) ?? shelf.get(k.replace(/^zelda /, ''));
  return found && ([...found].sort((a, b) => Number(b.status === 'owned') - Number(a.status === 'owned'))[0]);
}

export interface CharacterAppearance {
  title: string;
  year: number;
  game?: Game;
}

export function appearances(amiiboId: string): CharacterAppearance[] {
  return (BY_AMIIBO[amiiboId] ?? []).map(([title, year]) => ({ title, year, game: onShelf(title) })).sort((a, b) => a.year - b.year);
}
