/**
 * Downloads one wallpaper per game (LaunchBox "Fanart - Background") for the information strip.
 *
 *   output: src/assets/wallpapers/<game-id>.<hash>.webp   (1600 px wide, light enough to load on demand)
 *
 * Games that already have a wallpaper are skipped, so it can be re-run safely. To use your own
 * image for a game, drop it in src/assets/Wallpapers/ named after the game id (e.g. ps4-persona-5.jpg)
 * and run again: your files always win. Amiibos only take your own files: amiibo-<id>.jpg
 * (e.g. amiibo-marina.jpg; the ids are in src/data/amiibo.json).
 *
 * Run with: npm run wallpapers
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import data from '../src/data/games.json' with { type: 'json' };
import { searchTitle } from './search-titles.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/assets/wallpapers');
const MINE = path.join(ROOT, 'src/assets/Wallpapers');
const WIDTH = 1600;
const UA = 'Mozilla/5.0 (colecao-jogos; https://github.com/PauloTorrente/Mybacklog)';

/** How LaunchBox names each console; the Switch shelf also holds Switch 2 games, PlayStation holds PS5. */
const LB_PLATFORM = {
  switch: /Nintendo Switch/,
  '3ds': /Nintendo 3DS/,
  ds: /Nintendo DS$/,
  wii: /Nintendo Wii$/,
  ps4: /Sony Playstation [45]/,
};
const STOP = new Set(['the', 'of', 'a', 'an', 'and', 'in', 'to', 'for']);
const words = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

async function text(url) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    if (res.ok) return res.text();
    if (res.status === 429 || res.status >= 500) { await sleep(3000 * (i + 1)); continue; }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('muitas tentativas');
}

/** LaunchBox entries for a title: [{ id, title, platform }]. */
async function search(q) {
  const html = await text(`https://gamesdb.launchbox-app.com/games/results/${encodeURIComponent(q)}`);
  return [...html.matchAll(/href="\/games\/details\/(\d+)-[^"]*".*?<h3[^>]*>([^<]*)<\/h3>\s*<p[^>]*>([^<]*)<\/p>/gs)].map((m) => ({ id: m[1], title: decode(m[2]), platform: decode(m[3]) }));
}

/** Background fan-art URLs of a LaunchBox entry, widest first. */
async function fanart(id) {
  const html = await text(`https://gamesdb.launchbox-app.com/games/images/${id}`);
  return [...html.matchAll(/href="(https:\/\/images\.launchbox-app\.com\/[^"]+)"[^>]*data-title="([^"]*)"[^>]*data-footer="([^"]*)"/g)]
    .filter((m) => /Fanart - Background/.test(decode(m[2])))
    .map((m) => ({ url: m[1], width: Number(m[3].match(/^(\d+) x/)?.[1] ?? 0) }))
    .filter((a) => a.width >= 1280);
}

async function save(id, buf) {
  const out = await sharp(buf).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 68 }).toBuffer();
  const hash = createHash('sha1').update(out).digest('hex').slice(0, 8);
  await writeFile(path.join(OUT, `${id}.${hash}.webp`), out);
}

await mkdir(OUT, { recursive: true });
const have = new Set((await readdir(OUT)).map((f) => f.split('.')[0]));
const mine = new Map();
try {
  for (const f of await readdir(MINE)) if (/\.(jpe?g|png|webp)$/i.test(f)) mine.set(path.parse(f).name, f);
} catch { /* no folder of your own wallpapers */ }

const games = data.platforms.flatMap((p) => [...p.games, ...p.wishlist].map(([title]) => ({ id: slug(`${p.id} ${title}`), title, platform: p.id })));
const missing = [];
let n = 0;
for (const g of games) {
  n++;
  if (mine.has(g.id)) {
    for (const old of (await readdir(OUT)).filter((f) => f.split('.')[0] === g.id)) await (await import('node:fs/promises')).unlink(path.join(OUT, old));
    await save(g.id, await sharp(path.join(MINE, mine.get(g.id))).toBuffer());
    console.log(`${n}/${games.length} sua   ${g.title}`);
    continue;
  }
  if (have.has(g.id)) continue;
  try {
    const noAccent = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const queries = [...new Set([g.title.replace(/^Zelda: /, 'The Legend of Zelda: '), searchTitle(g.title).replace(/^page:/, '')].flatMap((q) => [q, noAccent(q)]))];
    const titles = queries.map(words);
    const fits = (t) => titles.some((tw) => { const w = new Set(words(t)); return tw.every((x) => w.has(x)); });
    const found = [];
    for (const q of queries) found.push(...(await search(q)));
    // Same console first, then the same game on another console (the art is the same).
    // Same console first, then the closest title (fewest extra words: "Hyrule Warriors" is not "… Age of Imprisonment").
    const extra = (t) => Math.min(...titles.map((tw) => words(t).filter((w) => !tw.includes(w)).length));
    const cands = found
      // Only real releases on Nintendo/Sony consoles (or arcade): no PC fan games or ROM hacks.
      .filter((c) => fits(c.title) && /Nintendo (Switch|3DS|DS|Wii|Wii U|GameCube)|Sony Playstation|Arcade/.test(c.platform))
      .sort((a, b) => extra(a.title) - extra(b.title) || Number(LB_PLATFORM[g.platform].test(b.platform)) - Number(LB_PLATFORM[g.platform].test(a.platform)));
    let picked = null;
    for (const c of [...new Map(cands.map((c) => [c.id, c])).values()].slice(0, 4)) {
      const arts = await fanart(c.id);
      if (arts.length) { picked = { c, art: arts[0] }; break; }
    }
    if (!picked) { missing.push(`${g.platform} ${g.title}`); console.log(`${n}/${games.length} --    ${g.title}`); continue; }
    const res = await fetch(picked.art.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
    await save(g.id, Buffer.from(await res.arrayBuffer()));
    console.log(`${n}/${games.length} ok    ${g.title}  ←  ${picked.c.title} [${picked.c.platform}]`);
  } catch (err) {
    missing.push(`${g.platform} ${g.title} (erro: ${err.message})`);
    console.log(`${n}/${games.length} !!    ${g.title}: ${err.message}`);
  }
  await sleep(600);
}
// Amiibo wallpapers from src/assets/wallpapers/amiibo/, named freely: every character named in the
// file name gets it ("Alm-Celica.jpg" → Alm and Celica, "Chrom,robin.lucina.jpg" → the three;
// "corrin.png" → both Corrin figures). Versions of a character share it unless one has its own file.
const AMIIBO_DIR = path.join(OUT, 'amiibo');
const amiiboItems = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(ROOT, 'src/data/amiibo.json'), 'utf8')).series.flatMap((s) => s.items);
const charOf = (item) => item.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/)[0];
let amiiboFiles = [];
try {
  amiiboFiles = (await readdir(AMIIBO_DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
} catch { /* no folder yet */ }
const claimed = new Map(); // amiibo id → [file, how specific]
for (const file of amiiboFiles) {
  const tokens = new Set(path.parse(file).name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  // "noahemio" style: also look for names glued together
  const glued = path.parse(file).name.toLowerCase().replace(/[^a-z]/g, '');
  for (const item of amiiboItems) {
    const c = charOf(item);
    if (!tokens.has(c) && !(c.length >= 3 && glued.includes(c) && tokens.size <= 2)) continue;
    const specific = tokens.has(item.id) ? 2 : 1;
    const prev = claimed.get(item.id);
    if (!prev || prev[1] < specific) claimed.set(item.id, [file, specific]);
  }
}
for (const [id, [file]] of claimed) {
  const name = `amiibo-${id}`;
  for (const old of (await readdir(OUT)).filter((f) => f.split('.')[0] === name)) await (await import('node:fs/promises')).unlink(path.join(OUT, old));
  await save(name, await sharp(path.join(AMIIBO_DIR, file)).toBuffer());
  console.log(`amiibo ${id.padEnd(16)} ← ${file}`);
}
for (const file of amiiboFiles) if (![...claimed.values()].some(([f]) => f === file)) console.log(`??    ${file}: nenhum amiibo com esse nome`);

// Amiibos with no image of their own borrow their signature game's wallpaper
// (a game id from the shelves, or a LaunchBox title for games that aren't on them).
const AMIIBO_GAME = {
  'samus-returns': '3ds-metroid-samus-returns',
  'samus-metroid-suit': 'switch-metroid-dread',
  'samus-prime-4': 'switch-metroid-prime-4',
  'samus-vi-o-la': 'switch-metroid-prime-4',
  daisy: 'switch-mario-kart-world',
  'daisy-smash': 'switch-super-smash-bros-ultimate',
  rosalina: 'wii-super-mario-galaxy',
  'rosalina-lumas': 'wii-super-mario-galaxy-2',
  'rosalina-smash': 'switch-super-smash-bros-ultimate',
  palutena: '3ds-kid-icarus',
  'bayonetta-p2': 'switch-bayonetta-2',
  'zelda-loftwing': 'wii-zelda-skyward-sword',
  'link-ocarina': '3ds-zelda-ocarina-of-time',
  'zelda-botw': 'switch-zelda-breath-of-the-wild',
  urbosa: 'switch-hyrule-warriors-age-of-calamity',
  riju: 'switch-zelda-breath-of-the-wild',
  'zelda-totk': 'switch-zelda-tears-of-the-kingdom',
  'inkling-girl': 'switch-splatoon-3-dlc',
  'inkling-boy': 'switch-splatoon-3-dlc',
  marina: 'switch-splatoon-3-dlc',
  'marina-side-order': 'switch-splatoon-3-dlc',
  magnamalo: 'switch-monster-hunter-rise',
  ratha: 'switch-monster-hunter-stories-2',
  ena: 'switch-monster-hunter-stories-2',
  ryu: 'switch-street-fighter-6',
  ken: 'switch-street-fighter-6',
  kimberly: 'switch-street-fighter-6',
  'mega-man': 'lb:Mega Man 11',
  'proto-man': 'lb:Mega Man 10',
  cloud: 'ps4-final-fantasy-vii-remake',
  sephiroth: 'switch-crisis-core',
  joker: 'ps4-persona-5',
  hero: 'switch-dragon-quest-xi-s',
  mewtwo: 'switch-pokken-tournament',
  'pokemon-trainer': "lb:Pokémon: Let's Go, Pikachu!",
  richter: 'lb:Castlevania: Symphony of the Night',
};
const ownAmiibo = new Set([...claimed.keys(), ...[...mine.keys()].filter((n) => n.startsWith('amiibo-')).map((n) => n.slice(7))]);
for (const [id, from] of Object.entries(AMIIBO_GAME)) {
  if (ownAmiibo.has(id)) continue;
  const name = `amiibo-${id}`;
  const current = (await readdir(OUT)).filter((f) => f.split('.')[0] === name);
  try {
    let buf;
    if (from.startsWith('lb:')) {
      if (current.length) continue; // already downloaded once
      const q = from.slice(3);
      const want = words(q);
      const cands = (await search(q)).filter((c) => { const w = new Set(words(c.title)); return want.every((x) => w.has(x)); });
      for (const c of cands.slice(0, 4)) {
        const arts = await fanart(c.id);
        if (!arts.length) continue;
        const res = await fetch(arts[0].url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
        buf = Buffer.from(await res.arrayBuffer());
        break;
      }
      if (!buf) { console.log(`--    amiibo ${id}: nada no LaunchBox para "${q}"`); continue; }
    } else {
      const src = (await readdir(OUT)).find((f) => f.split('.')[0] === from);
      if (!src) { console.log(`--    amiibo ${id}: o jogo ${from} ainda não tem wallpaper`); continue; }
      buf = await (await import('node:fs/promises')).readFile(path.join(OUT, src));
    }
    for (const old of current) await (await import('node:fs/promises')).unlink(path.join(OUT, old));
    await save(name, buf);
    console.log(`amiibo ${id.padEnd(16)} ← ${from}`);
  } catch (err) {
    console.log(`!!    amiibo ${id}: ${err.message}`);
  }
}

// Amiibo wallpapers: only your own files (amiibo-<id>.jpg).
const amiiboIds = new Set(JSON.parse(await (await import('node:fs/promises')).readFile(path.join(ROOT, 'src/data/amiibo.json'), 'utf8')).series.flatMap((s) => s.items.map((i) => `amiibo-${i.id}`)));
for (const [name, file] of mine) {
  if (!name.startsWith('amiibo-')) continue;
  if (!amiiboIds.has(name)) { console.log(`??    ${file}: não existe amiibo com esse id`); continue; }
  for (const old of (await readdir(OUT)).filter((f) => f.split('.')[0] === name)) await (await import('node:fs/promises')).unlink(path.join(OUT, old));
  await save(name, await sharp(path.join(MINE, file)).toBuffer());
  console.log(`sua   ${file}`);
}
console.log(`\nSem wallpaper (${missing.length}):\n  ${missing.join('\n  ')}`);
