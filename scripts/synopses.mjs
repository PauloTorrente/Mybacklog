/**
 * Applies the hand-written Portuguese synopses (server/data/synopses/<console>.json, keyed by title)
 * to the catalogue, replacing whatever synopsis was there. Credits and prices are left untouched.
 *
 * Run with: npm run synopses
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readCatalog, saveEntry } from '../server/store.mjs';
import data from '../src/data/games.json' with { type: 'json' };

const DIR = path.join(import.meta.dirname, '..', 'server', 'data', 'synopses');
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

let applied = 0;
const missing = [];
for (const p of data.platforms) {
  const texts = JSON.parse(await readFile(path.join(DIR, `${p.id}.json`), 'utf8'));
  for (const [title] of [...p.games, ...p.wishlist]) {
    const text = texts[title];
    if (!text) { missing.push(`${p.id} ${title}`); continue; }
    const id = slug(`${p.id} ${title}`);
    const current = (await readCatalog())[id] ?? {};
    await saveEntry(id, { ...current, synopsis: text });
    applied++;
  }
  const unknown = Object.keys(texts).filter((t) => ![...p.games, ...p.wishlist].some(([g]) => g === t));
  if (unknown.length) console.log(`?? ${p.id}: títulos que não estão na lista: ${unknown.join(', ')}`);
}
console.log(`${applied} sinopses aplicadas.`);
if (missing.length) console.log(`Sem sinopse escrita (${missing.length}):\n  ${missing.join('\n  ')}`);
