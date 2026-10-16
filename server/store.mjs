/**
 * The catalogue: prices and game details typed in the admin, keyed by item id
 * (a game id like "switch-persona-5", or "amiibo-<id>"). Stored as one JSON file.
 */
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';

const FILE = path.join(import.meta.dirname, 'data', 'catalog.json');

const TEXT_FIELDS = ['publisher', 'developer', 'released', 'director', 'composer', 'synopsis'];
const MAX_TEXT = { synopsis: 2000 };

let cache = null;
let cachedAt = 0;

/** Re-reads the file whenever it changed on disk (e.g. `npm run catalog:fill` ran while the server was up). */
export async function readCatalog() {
  const { mtimeMs } = await stat(FILE);
  if (!cache || mtimeMs !== cachedAt) {
    cache = JSON.parse(await readFile(FILE, 'utf8'));
    cachedAt = mtimeMs;
  }
  return cache;
}

/** Keeps only known fields, trimmed; empty values are dropped so the entry stays small. */
export function clean(input) {
  const out = {};
  for (const key of ['priceMin', 'priceMax']) {
    const v = input?.[key];
    if (v === '' || v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100000) throw new Error(`${key} inválido`);
    out[key] = Math.round(n * 100) / 100;
  }
  if (out.priceMin !== undefined && out.priceMax !== undefined && out.priceMin > out.priceMax) {
    [out.priceMin, out.priceMax] = [out.priceMax, out.priceMin];
  }
  for (const key of TEXT_FIELDS) {
    const v = input?.[key];
    if (typeof v !== 'string') continue;
    const t = v.trim().slice(0, MAX_TEXT[key] ?? 200);
    if (t) out[key] = t;
  }
  return out;
}

export async function saveEntry(id, input) {
  if (!/^[a-z0-9-]{1,120}$/.test(id)) throw new Error('id inválido');
  const catalog = await readCatalog();
  const entry = clean(input);
  if (Object.keys(entry).length) catalog[id] = entry;
  else delete catalog[id];
  // Write to a temp file first, then swap: a crash mid-write never leaves a half-written catalogue.
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(catalog, null, 2) + '\n');
  await rename(tmp, FILE);
  cachedAt = (await stat(FILE)).mtimeMs;
  return entry;
}
