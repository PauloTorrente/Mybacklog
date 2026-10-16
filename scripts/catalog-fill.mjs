/**
 * Fills the catalogue (server/data/catalog.json) with every game's credits and synopsis from
 * Wikipedia/Wikidata. Only empty fields are filled: whatever was typed in the admin is kept.
 * Prices are never touched. Writes a report to server/data/fill-report.txt to review matches.
 *
 * Run with: npm run catalog:fill            (only games without a synopsis yet)
 *           npm run catalog:fill -- --all   (look every game up again, still filling only empty fields)
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { lookup } from '../server/lookup.mjs';
import { readCatalog, saveEntry } from '../server/store.mjs';
import data from '../src/data/games.json' with { type: 'json' };

import { searchTitle } from './search-titles.mjs';

const all = process.argv.includes('--all');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const FIELDS = ['publisher', 'developer', 'released', 'director', 'composer', 'synopsis'];

const report = [];
const games = data.platforms.flatMap((p) => [...p.games, ...p.wishlist].map(([title]) => ({ id: slug(`${p.id} ${title}`), title, platform: p.id })));
let done = 0;
for (const g of games) {
  done++;
  const current = (await readCatalog())[g.id] ?? {};
  if (!all && current.synopsis) continue;
  try {
    const r = await lookup(searchTitle(g.title), g.platform);
    if (!r) {
      report.push(`??  ${g.platform.padEnd(6)} ${g.title}  →  nada encontrado`);
    } else {
      const next = { ...current };
      for (const k of FIELDS) if (!next[k] && r[k]) next[k] = r[k];
      await saveEntry(g.id, next);
      const missing = FIELDS.filter((k) => !next[k]);
      report.push(`ok  ${g.platform.padEnd(6)} ${g.title}  →  ${r.source}${missing.length ? `  (sem: ${missing.join(', ')})` : ''}`);
    }
  } catch (err) {
    report.push(`!!  ${g.platform.padEnd(6)} ${g.title}  →  erro: ${err.message}`);
  }
  console.log(`${done}/${games.length} ${report.at(-1)}`);
  await sleep(1200); // be gentle with Wikipedia
}
await writeFile(path.join(import.meta.dirname, '..', 'server', 'data', 'fill-report.txt'), report.join('\n') + '\n');
console.log('\nRelatório em server/data/fill-report.txt');
