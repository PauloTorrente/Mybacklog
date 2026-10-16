/**
 * Which games each amiibo works with, and what it does in each one, from amiibo.life.
 *
 *   output: src/data/amiibo-games.json   { <amiibo id>: { url, as: { figure|character|series: [{ platform, title, does }] } } }
 *
 * Run with: npm run amiibo:games   (re-run when you add amiibos to src/data/amiibo.json)
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const UA = 'Mozilla/5.0 (colecao-jogos; https://github.com/PauloTorrente/Mybacklog)';

/** Our amiibo id → amiibo.life page (series/figure). */
const PAGE = {
  marth: 'super-smash-bros/marth',
  tiki: 'fire-emblem/tiki',
  alm: 'fire-emblem/alm',
  celica: 'fire-emblem/celica',
  roy: 'super-smash-bros/roy',
  ike: 'super-smash-bros/ike',
  byleth: 'super-smash-bros/byleth',
  'corrin-female': 'super-smash-bros/corrin-player-2',
  'chrom-smash': 'super-smash-bros/chrom',
  chrom: 'fire-emblem/chrom',
  robin: 'super-smash-bros/robin',
  lucina: 'super-smash-bros/lucina',
  corrin: 'super-smash-bros/corrin',
  shulk: 'super-smash-bros/shulk',
  pyra: 'super-smash-bros/pyra',
  mythra: 'super-smash-bros/mythra',
  noah: 'xenoblade-chronicles/noah',
  mio: 'xenoblade-chronicles/mio',
  cloud: 'super-smash-bros/cloud',
  sephiroth: 'super-smash-bros/sephiroth',
  joker: 'super-smash-bros/joker',
  hero: 'super-smash-bros/hero',
  mewtwo: 'super-smash-bros/mewtwo',
  'pokemon-trainer': 'super-smash-bros/pokemon-trainer',
  richter: 'super-smash-bros/richter',
  'zelda-loftwing': 'the-legend-of-zelda/zelda-loftwing-skyward-sword',
  'link-ocarina': 'the-legend-of-zelda/link-ocarina-of-time',
  'zelda-botw': 'the-legend-of-zelda/zelda',
  urbosa: 'the-legend-of-zelda/urbosa-gerudo-champion',
  riju: 'the-legend-of-zelda/riju',
  'zelda-totk': 'the-legend-of-zelda/zelda-tears-of-the-kingdom',
  'inkling-girl': 'splatoon/inkling-girl-neon-pink',
  'inkling-boy': 'splatoon/inkling-boy-purple',
  marina: 'splatoon/marina',
  'marina-side-order': 'splatoon/marina-side-order',
  magnamalo: 'monster-hunter-rise/magnamalo',
  ratha: 'monster-hunter-stories/ratha',
  ena: 'monster-hunter-stories/ena',
  ryu: 'super-smash-bros/ryu',
  ken: 'super-smash-bros/ken',
  kimberly: 'street-fighter/kimberly',
  'mega-man': 'mega-man/mega-man-mega-man-dual-override',
  'proto-man': 'mega-man/proto-man',
  daisy: 'super-mario/daisy',
  'daisy-smash': 'super-smash-bros/daisy',
  rosalina: 'super-mario/rosalina',
  'rosalina-lumas': 'super-mario/rosalina-and-lumas',
  'rosalina-smash': 'super-smash-bros/rosalina',
  palutena: 'super-smash-bros/palutena',
  'bayonetta-p2': 'super-smash-bros/bayonetta-player-2',
  'samus-returns': 'metroid/samus-aran-metroid-samus-returns',
  'samus-metroid-suit': 'metroid/samus-metroid-suit',
  'samus-prime-4': 'metroid/samus-metroid-prime-4',
  'samus-vi-o-la': 'metroid/samus-vi-o-la',
};

const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The "Compatible Games" block as lines of text, links kept as markers: ⟦/games/switch/splatoon-3⟧. */
function lines(html) {
  const start = html.indexOf('Compatible Games');
  const end = html.indexOf('work with any', start);
  const block = html.slice(start, end > 0 ? end : undefined)
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<a[^>]*href="(\/games\/[^"]+)"[^>]*>/g, '\n⟦$1⟧\n')
    .replace(/<[^>]+>/g, '\n');
  return decode(block).split('\n').map((l) => l.trim()).filter(Boolean);
}

const SECTION = { figure: /^games? as figure$/, character: /^games? as character$/, series: /^games? as part of series$/ };
const PLATFORMS = new Set(['Switch 2', 'Switch', 'Wii U', '3DS', 'New 3DS', 'DS', 'Wii']);

function parse(html) {
  const ls = lines(html);
  const out = { figure: [], character: [], series: [] };
  let section = null;
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i];
    const s = Object.entries(SECTION).find(([, rx]) => rx.test(l));
    if (s) { section = s[0]; continue; }
    if (!section) continue;
    // A game: ⟦link⟧, platform, title, then what it does (until the next link or section).
    if (l.startsWith('⟦')) {
      const link = l.slice(1, -1);
      let j = i + 1;
      const plat = PLATFORMS.has(ls[j]) ? ls[j++] : link.split('/')[2];
      // the title can be repeated after a second link marker
      while (ls[j]?.startsWith('⟦')) j++;
      const title = ls[j++];
      const does = [];
      while (j < ls.length && !ls[j].startsWith('⟦') && !/^Use it in$/.test(ls[j]) && !Object.values(SECTION).some((rx) => rx.test(ls[j]))) {
        if (!PLATFORMS.has(ls[j])) does.push(ls[j]);
        j++;
      }
      if (title && !out[section].some((g) => g.title === title && g.platform === plat)) {
        out[section].push({ platform: plat, title, ...translate(does.join(' ')) });
      }
      i = j - 1;
    }
  }
  return out;
}

/** Splits the English description into features and translates each one (scripts/amiibo-pt.json). */
const PT = JSON.parse(await readFile(path.join(import.meta.dirname, 'amiibo-pt.json'), 'utf8'));
const untranslated = new Set();
const FEATURE_START = /(?<!:)\s+(?=(?:Unlock|Receive|Summon|Save|Invite|Play|Get|Use|Change|See|Improve|Revisit|Take|Scan|Battle|Add|Restore|Replenish|Enter|Have|Access|After beating|Give|Customize|Minigame|More easily|Quickly|Figure appears)\b)/;
function translate(text) {
  const writes = /\(Read\+Write\)/.test(text);
  const parts = text
    .replace(/\s*Many games also have non-character-specific features that\s*$/, '')
    .replace(/\(Read\+Write\)/g, ' / ')
    .replace(/and\s*\/\s*or/g, 'and/or')
    .split(/\s*\/\s*(?!or\b)/) // "and/or" is part of a sentence, not a separator
    .flatMap((p) => p.split(FEATURE_START))
    .map((p) => p.trim())
    .filter(Boolean);
  const pt = parts.map((p) => {
    if (PT[p]) return PT[p];
    untranslated.add(p);
    return p;
  });
  return { does: [...new Set(pt)], saves: writes };
}

const result = {};
for (const [id, page] of Object.entries(PAGE)) {
  const url = `https://amiibo.life/amiibo/${page}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const as = parse(await res.text());
    result[id] = { url, as };
    console.log(`ok  ${id.padEnd(20)} figura ${as.figure.length} · personagem ${as.character.length} · série ${as.series.length}`);
  } catch (err) {
    console.log(`!!  ${id}: ${err.message}`);
  }
  await sleep(800);
}
await writeFile(path.join(ROOT, 'src/data/amiibo-games.json'), JSON.stringify(result, null, 1) + '\n');
const ids = JSON.parse(await readFile(path.join(ROOT, 'src/data/amiibo.json'), 'utf8')).series.flatMap((s) => s.items.map((i) => i.id));
if (untranslated.size) console.log(`\nSem tradução (adicione em scripts/amiibo-pt.json):\n  ${[...untranslated].join('\n  ')}`);
const missing = ids.filter((i) => !PAGE[i]);
if (missing.length) console.log(`\nSem página no amiibo.life (adicione em PAGE): ${missing.join(', ')}`);
