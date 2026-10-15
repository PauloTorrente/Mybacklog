/**
 * Turns box-art scans into light per-face images for the 3D shelf.
 *
 *   input:  src/assets/capas/*.{jpg,jpeg,png,webp}   (originals, any size)
 *   output: src/assets/covers/<game-id>-{front,spine,back}.<hash>.webp
 *   (the hash changes with the image, so browsers never show a stale cover after a swap)
 *
 * Two kinds of input are understood:
 *   - Full inserts: the whole printed sheet, back | spine | front (sometimes stored standing up).
 *     e.g. "nintendo_switch.bayonetta2_US.123.jpg"
 *   - Separate pieces: one file per face, named "...-front-cover", "...-back-cover", "...-spinesides".
 *     e.g. "19139907-unicorn-overlord-nintendo-switch-front-cover.jpg"
 *
 * Files are matched to games by name. Run with: npm run covers
 */
import { readdir, readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IN = path.join(ROOT, 'src/assets/capas');
const OUT = path.join(ROOT, 'src/assets/covers');
const HEIGHT = { front: 560, spine: 560, back: 420 };
const QUALITY = { front: 80, spine: 80, back: 72 };

/** Spine width as a fraction of the case height, picked by the unfolded insert's aspect ratio. */
const FORMATS = [
  { name: '3DS', minAspect: 2.0, spine: 0.104 },
  { name: 'PlayStation', minAspect: 1.5, spine: 0.085 },
  { name: 'Switch/DS/Wii', minAspect: 0, spine: 0.059 },
];
/** Measured on the scans: the spine is centred slightly left of the middle. */
const SPINE_CENTER = 0.4975;
/** Trim scan bleed off the outer edges of full inserts. */
const BLEED = 0.006;

/** Files whose name is wrong or vague (checked by eye): file name → game id. */
const FILE_GAME = {
  'nintendo_switch.mariokart8deluxe_CA.16340330041741829091.jpg': 'switch-metroid-dread',
  'nintendo_switch.xxxxxxxempty_US.17088041431309980034.jpg': 'switch-captain-toad',
  'nintendo_switch.supermarioodyssey_US.16355507833878024.jpg': 'switch-super-mario-3d-world',
  // "Dragon Quest I & II" and "Dragon Quest III" squash to the same letters, so name these two explicitly.
  'nintendo_switch.dragonquest1e2hd2d_reversivel.0.jpg': 'switch-dragon-quest-i-ii',
  'nintendo_switch.dragonquest3hd2d_JA.0.jpg': 'switch-dragon-quest-iii',
  '1241157_front.jpg': 'switch-granblue-fantasy-relink-endless-ragnarok', // only a number in the name
  // "Mario Hoops 3-on-3" is the US name of Mario Slam Basketball.
  '4471973-mario-hoops-3-on-3-nintendo-ds-front-cover.jpg': 'ds-mario-slam-basketball',
  '4472232-mario-hoops-3-on-3-nintendo-ds-back-cover.jpg': 'ds-mario-slam-basketball',
  '4471999-mario-hoops-3-on-3-nintendo-ds-spinesides.jpg': 'ds-mario-slam-basketball',
};

/** Pieces whose name doesn't say which face they are: file name → face. */
const FILE_FACE = {
  '7707949-final-fantasy-xii-the-zodiac-age-nintendo-switch-inside-cover.jpg': 'front',
  '7707973-final-fantasy-xii-the-zodiac-age-nintendo-switch-inside-cover.jpg': 'back', // inner artwork; no back scan
  '7707976-final-fantasy-xii-the-zodiac-age-nintendo-switch-inside-cover.jpg': 'spine',
};

/** Squashed names that don't map to a title by themselves. */
const NAME_GAME = {
  dragonquestiiihd2dremake: 'switch-dragon-quest-iii', // "Dragon Quest I & II" squashes to the same letters
  hyrulewarriorsdefinitiveedition: 'switch-hyrule-warriors-original',
  marvelvscapcomfightingcollectionarcadeclassics: 'switch-marvel-vs-capcom-collection',
  splatoon3: 'switch-splatoon-3-dlc',
};

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slugify = (s) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const squash = (s) => normalize(s).replace(/[^a-z0-9]/g, '');

const data = JSON.parse(await readFile(path.join(ROOT, 'src/data/games.json'), 'utf8'));
const games = data.platforms.flatMap((p) =>
  [...p.games, ...p.wishlist].map(([title]) => ({ id: slugify(`${p.id} ${title}`), slug: slugify(title), key: squash(title), platform: p.id, title })),
);
const byId = new Map(games.map((g) => [g.id, g]));
const rank = (list, platform) =>
  list.sort((a, b) => (b.platform === platform) - (a.platform === platform) || b.key.length - a.key.length)[0];

// --- Full inserts: "nintendo_switch.bayonetta2_US.123.jpg" -------------------------------------

const PLATFORM_PREFIX = /^(nintendo_switch_2|nintendo_switch|switch|nintendo_3ds|3ds|nintendo_ds|ds|nintendo_wii|wii|playstation_\d|ps\d)[._-]/i;
const FILE_PLATFORM = { nintendo_switch_2: 'switch', nintendo_switch: 'switch', switch: 'switch', nintendo_3ds: '3ds', '3ds': '3ds', nintendo_ds: 'ds', ds: 'ds', nintendo_wii: 'wii', wii: 'wii' };

function matchInsert(file) {
  let base = path.parse(file).name;
  const m = base.match(PLATFORM_PREFIX);
  const platform = m ? FILE_PLATFORM[m[1].toLowerCase()] ?? null : null;
  if (m) base = base.slice(m[0].length);
  base = base.replace(/\(\d+\)$/, '').replace(/_[A-Z]{0,3}\.\d+$/i, '');
  // Store names put "The" at the end and spell out "Legend of Zelda"; the list says "Zelda: …".
  const key = squash(base).replace(/the$/, '').replace(/^legendof/, '');
  if (NAME_GAME[key]) return byId.get(NAME_GAME[key]);
  // Exact first, then the longest title the name starts with ("minecraftdungeonsultimateedition").
  return rank(games.filter((g) => g.key === key), platform) ?? rank(games.filter((g) => g.key.length >= 5 && key.startsWith(g.key)), platform);
}

/** GameTDB stretches DS inserts to the 3DS template; squeeze them back to a real DS case (front .91, spine .112). */
const DS_STRETCHED = { name: 'DS (GameTDB)', aspect: 1.93, spine: 0.112 };
/** Wii inserts are ~1.5 wide like PlayStation ones, but with a thinner spine (measured on GameTDB scans). */
const WII = { name: 'Wii', spine: 0.068 };

async function splitInsert(file, game) {
  const meta = await sharp(path.join(IN, file)).metadata();
  // Some scans are stored standing up (back on top); lay them down: back | spine | front.
  const portrait = meta.height > meta.width;
  let W = portrait ? meta.height : meta.width;
  const H = portrait ? meta.width : meta.height;
  let img = sharp(path.join(IN, file)).rotate(portrait ? 270 : 0);
  let format = FORMATS.find((f) => W / H >= f.minAspect);
  if (game.platform === 'wii') format = WII;
  if (game.platform === 'ds' && W / H > 2.2) {
    W = Math.round(H * DS_STRETCHED.aspect);
    img = img.resize({ width: W, height: H, fit: 'fill' });
    format = DS_STRETCHED;
  }
  const buf = await img.toBuffer();

  const spineW = Math.round(H * format.spine);
  const spineL = Math.round(W * SPINE_CENTER - spineW / 2);
  const bx = Math.round(W * BLEED);
  const by = Math.round(H * BLEED);
  const crop = (left, width) => sharp(buf).extract({ left, top: by, width, height: H - 2 * by });
  return {
    format: format.name,
    faces: {
      front: crop(spineL + spineW, W - spineL - spineW - bx),
      spine: crop(spineL, spineW),
      back: crop(bx, spineL - bx),
    },
  };
}

// --- Separate pieces: "19139907-unicorn-overlord-nintendo-switch-front-cover.jpg" --------------

const PIECE_PLATFORM = /-(nintendo-switch(-2)?|nintendo-3ds|nintendo-ds|nintendo-wii|wii|playstation-\d)(-|$)/;

function pieceFace(file) {
  if (FILE_FACE[file]) return FILE_FACE[file];
  const name = path.parse(file).name.toLowerCase();
  // The face is the LAST face word ("endless-frontier-...-back-cover" is a back).
  // Long names get cut off by the download site: "...-switch-2-fr", "...-switch-2-ba", "...-spines".
  const words = [...name.matchAll(/spine|front|back|-sp[a-z]*$|-fr[a-z]*$|-ba[a-z]*$/g)];
  if (!words.length) return null;
  const w = words.at(-1)[0];
  return w.includes('sp') ? 'spine' : w.includes('fr') ? 'front' : 'back';
}

function matchPiece(file) {
  let name = path.parse(file).name.toLowerCase().replace(/^\d+-/, '');
  const m = name.match(PIECE_PLATFORM);
  const platform = m ? (m[1].includes('switch') ? 'switch' : m[1].includes('3ds') ? '3ds' : m[1].includes('wii') ? 'wii' : m[1].endsWith('-ds') ? 'ds' : null) : null;
  if (m) name = name.slice(0, m.index);
  else name = name.replace(/-?(front|back|spine).*$/, '');
  const slug = slugify(name);
  // Word-aware prefix: "dragon-quest-i-ii-hd-2d-remake" is "Dragon Quest I & II", never "Dragon Quest III".
  const exact = games.filter((g) => g.slug === slug);
  if (exact.length) return rank(exact, platform);
  const prefixed = games.filter((g) => slug.startsWith(`${g.slug}-`));
  if (prefixed.length) return rank(prefixed, platform);
  // No dashes in the name ("metroidprime4front"): fall back to squashed letters.
  const key = squash(name);
  return rank(games.filter((g) => g.key.length >= 5 && key.startsWith(g.key)), platform);
}

// --- Run ----------------------------------------------------------------------------------------

await mkdir(OUT, { recursive: true });
const files = (await readdir(IN)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();

/** game id → { face → { file, image } } */
const plan = new Map();
const notes = [];
const unmatched = [];

const add = (game, face, file, image) => {
  const faces = plan.get(game.id) ?? {};
  if (faces[face]) {
    notes.push(`= ${file}  (repetida: ${game.title} já tem ${face} de ${faces[face].file})`);
    return;
  }
  faces[face] = { file, image };
  plan.set(game.id, faces);
};

// Pieces first, so a dedicated front/back/spine scan wins over one cut out of a full insert.
// The face word must end the name ("metroidprime4front", "...-back-cover"), so "runefactoryfrontier" stays an insert.
const isPiece = (f) => /^\d+-/.test(f) || /(front|back|spine)(-?cover|sides?)?$/i.test(path.parse(f).name) || FILE_FACE[f] || FILE_GAME[f]?.length && /_(front|back|spine)/.test(f);
for (const file of files.filter(isPiece)) {
  const game = FILE_GAME[file] ? byId.get(FILE_GAME[file]) : matchPiece(file);
  const face = pieceFace(file);
  if (!game || !face) { unmatched.push(file); continue; }
  let image = sharp(path.join(IN, file));
  // GameTDB stretches DS fronts to the 3DS template; squeeze them back to a DS case (front .91 wide).
  const { width, height } = await image.metadata();
  if (game.platform === 'ds' && face === 'front' && width / height > 1) {
    image = sharp(await image.resize({ width: Math.round(height * 0.91), height, fit: 'fill' }).toBuffer());
  }
  add(game, face, file, image);
}
const formats = new Map();
for (const file of files.filter((f) => !isPiece(f))) {
  const game = FILE_GAME[file] ? byId.get(FILE_GAME[file]) : matchInsert(file);
  if (!game) { unmatched.push(file); continue; }
  if (['front', 'spine', 'back'].every((f) => plan.get(game.id)?.[f])) {
    notes.push(`= ${file}  (repetida: ${game.title} já está completo)`);
    continue;
  }
  let split;
  try {
    split = await splitInsert(file, game);
  } catch (err) {
    notes.push(`! ${file}  (imagem quebrada ou incompleta: ${err.message})`);
    continue;
  }
  const { format, faces } = split;
  formats.set(game.id, format);
  for (const [face, image] of Object.entries(faces)) add(game, face, file, image);
}

// The output folder is fully generated: clear it so removed games and replaced covers don't linger.
for (const f of await readdir(OUT)) if (f.endsWith('.webp')) await unlink(path.join(OUT, f));

for (const [id, faces] of plan) {
  for (const [face, { image }] of Object.entries(faces)) {
    const buf = await image.clone().resize({ height: HEIGHT[face] }).webp({ quality: QUALITY[face] }).toBuffer();
    const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
    await writeFile(path.join(OUT, `${id}-${face}.${hash}.webp`), buf);
  }
  const game = byId.get(id);
  const have = ['front', 'spine', 'back'].map((f) => (faces[f] ? f[0].toUpperCase() : '·')).join('');
  console.log(`✓ ${game.title.padEnd(40)} ${have}  ${formats.get(id) ?? 'peças'}`);
}

console.log(`\n${plan.size} jogos com capa em src/assets/covers/  (F = frente, S = lombada, B = verso)`);
if (notes.length) console.log(notes.join('\n'));
if (unmatched.length) console.log(`\nSem jogo correspondente na lista (${unmatched.length}):\n  ${unmatched.join('\n  ')}`);
