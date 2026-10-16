/**
 * Finds a game's details on Wikipedia/Wikidata: publisher, developer, release year, director,
 * composer and a synopsis (Portuguese article when there is one, else English).
 *
 *   1. Search English Wikipedia for "<title> <console> video game".
 *   2. Take the first result whose Wikidata item lists that console (so God of War on PS4 is the
 *      2018 game, not the 2005 one); if none does, the first result that is a video game.
 *   3. Credits come from the article's infobox (it has director/composer far more often than
 *      Wikidata), with Wikidata as the fallback.
 *
 * The admin reviews the result before saving; scripts/catalog-fill.mjs runs it for every game.
 */
// Wikimedia asks scripts to identify themselves with a way to reach the project.
const UA = 'colecao-jogos/0.1 (https://github.com/PauloTorrente/Mybacklog)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with polite retries: Wikimedia answers 429 when asked too fast, so wait and try again. */
async function get(url, tries = 5) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && i < tries) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** i;
      await sleep(Math.min(wait, 30000));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
}

/** Wikidata items of each console ("platform", P400). The Switch shelf also holds Switch 2 games. */
const PLATFORM_Q = {
  switch: ['Q19610114', 'Q122761124'],
  '3ds': ['Q203597'],
  ds: ['Q170323'],
  wii: ['Q8079'],
  ps4: ['Q5014725', 'Q63184502'],
};
const PLATFORM_NAME = { switch: 'Nintendo Switch', '3ds': 'Nintendo 3DS', ds: 'Nintendo DS', wii: 'Wii', ps4: 'PlayStation 4' };
const IS_GAME = /\b(video ?game|role-playing game|jogo eletrônico)\b/i;
/** Pages that are about something else: "video game series", "video game developer", a company, a film… */
const NOT_GAME = /(video game|game|media|role-playing) (developer|publisher|company|series|franchise|character|console|studio|soundtrack)|^(series|franchise|media franchise)\b|\b(company|manga|anime series|film|list of)\b/i;
const STOP = new Set(['the', 'of', 'a', 'an', 'and', 'in', 'to', 'for']);
/** Edition words: "Mario Kart 8 Deluxe" is the "Mario Kart 8" article. */
const EDITION = new Set(['deluxe', 'remastered', 'remaster', 'hd', 'definitive', 'edition', 'complete', 'ultimate', 'royal', 'dx', 'reunion', 'remake', 'year', 'game', 'goty']);

/** Strips wiki markup from an infobox value: links, templates, refs, footnotes, line breaks. */
function plain(value) {
  let v = value
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{(?:efn|refn|sfn|nbsp|ref|cn|citation needed)[^{}]*\}\}/gi, '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '');
  // List templates ({{plainlist|* a * b}}, {{ubl|a|b}}): keep the items.
  for (let i = 0; i < 4; i++) {
    v = v.replace(/\{\{\s*(?:plain ?list|flat ?list|unbulleted list|ubl|hlist|collapsible list)\s*\|([^{}]*)\}\}/gi, (_, inner) =>
      inner.split(/\||\n\s*\*/).map((s) => s.replace(/^\s*\*\s*/, '').trim()).filter((s) => s && !/=/.test(s)).join(', '),
    );
    v = v.replace(/\{\{[^{}]*\}\}/g, '');
  }
  return v.replace(/<[^>]+>/g, '').replace(/\s*,\s*(,\s*)+/g, ', ').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '').trim();
}

function infobox(wikitext, key) {
  const lines = wikitext.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^\\s*\\|\\s*${key}\\s*=`).test(l));
  if (start < 0) return '';
  // A value can continue on the next lines (lists) until the next "| field =".
  let raw = lines[start].replace(/^\s*\|\s*[^=]+=/, '');
  for (let i = start + 1; i < lines.length && !/^\s*\|\s*[\w ]+=/.test(lines[i]) && !/^\s*\}\}/.test(lines[i]); i++) raw += `\n${lines[i]}`;
  return plain(raw).slice(0, 200);
}

async function summary(lang, page) {
  try {
    const s = await get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`);
    return s.type === 'disambiguation' ? '' : (s.extract ?? '');
  } catch {
    return '';
  }
}

/**
 * "page:<Wikipedia title>" skips the search and reads that exact article (for games the search keeps
 * getting wrong, e.g. "page:Itadaki Street" for Boom Street). Set in scripts/search-titles.mjs.
 */
export async function lookup(title, platform) {
  if (title.startsWith('page:')) return details(title.slice(5), platform);
  const query = `${title} ${PLATFORM_NAME[platform] ?? ''} video game`.trim();
  const search = await get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=6&format=json`);
  const pages = search.query.search.map((r) => r.title);
  if (!pages.length) return null;

  // Wikidata item of each candidate page.
  const props = await get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(pages.join('|'))}&format=json&formatversion=2`);
  const qOf = Object.fromEntries((props.query.pages ?? []).map((p) => [p.title, p.pageprops?.wikibase_item]));
  const qids = pages.map((p) => qOf[p]).filter(Boolean);
  if (!qids.length) return null;
  const ents = (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qids.join('|')}&props=claims|descriptions|sitelinks&languages=en&format=json`)).entities;

  const wanted = PLATFORM_Q[platform] ?? [];
  const onPlatform = (q) => (ents[q]?.claims?.P400 ?? []).some((c) => wanted.includes(c.mainsnak.datavalue?.value?.id));
  const isGame = (q) => {
    const d = ents[q]?.descriptions?.en?.value ?? '';
    return IS_GAME.test(d) && !NOT_GAME.test(d);
  };
  // Every word of the title must be in the article's title ("Xenoblade Chronicles X" is not "… 2").
  const words = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  const allWords = words(title);
  const titleWords = allWords.filter((w) => !EDITION.has(w));
  const matches = (p) => {
    const pw = new Set(words(p));
    return titleWords.every((w) => pw.has(w));
  };
  // Closest title wins: shared words count, extra words in the article title cost a little,
  // and being on the right console breaks ties ("Metroid Prime Remastered" beats "Metroid Prime 4: Beyond").
  const score = (p) => {
    const pw = words(p.replace(/\s*\(.*\)$/, ''));
    const shared = allWords.filter((w) => pw.includes(w)).length;
    const extra = pw.filter((w) => !allWords.includes(w)).length;
    // Wikipedia's own ranking breaks remaining ties (it puts God of War 2018 first for a PS4 search).
    return shared - 0.6 * extra + (onPlatform(qOf[p]) ? 0.5 : 0) - 0.01 * pages.indexOf(p);
  };
  const best = pages.filter((p) => qOf[p] && matches(p) && !NOT_GAME.test(ents[qOf[p]]?.descriptions?.en?.value ?? '')).sort((a, b) => score(b) - score(a))[0];
  const page =
    best ??
    pages.find((p) => qOf[p] && onPlatform(qOf[p]) && !NOT_GAME.test(ents[qOf[p]]?.descriptions?.en?.value ?? '')) ??
    pages.find((p) => qOf[p] && isGame(qOf[p]));
  if (!page) return null;
  return details(page, platform);
}

async function details(page, platform) {
  const pp = await get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(page)}&format=json&formatversion=2`);
  const p0 = pp.query.pages?.[0];
  const q = p0?.pageprops?.wikibase_item;
  if (!q) return null;
  page = p0.title;
  const entity = (await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${q}&props=claims|sitelinks&format=json`)).entities[q];

  // Wikidata labels for the credits (fallback when the infobox doesn't have them).
  const idsOf = (p) => (entity.claims[p] ?? []).map((c) => c.mainsnak.datavalue?.value?.id).filter(Boolean);
  const all = [...new Set(['P123', 'P178', 'P57', 'P86'].flatMap(idsOf))];
  const labels = {};
  if (all.length) {
    const res = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${all.slice(0, 45).join('|')}&props=labels&languages=pt|en|mul&format=json`);
    for (const [id, e] of Object.entries(res.entities)) labels[id] = e.labels?.pt?.value ?? e.labels?.en?.value ?? e.labels?.mul?.value ?? '';
  }
  const names = (p) => idsOf(p).map((id) => labels[id]).filter(Boolean).slice(0, 4).join(', ');

  const wt = (await get(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&section=0&format=json&formatversion=2`)).parse?.wikitext ?? '';
  const dates = (entity.claims.P577 ?? []).map((c) => c.mainsnak.datavalue?.value?.time).filter(Boolean).sort();
  const year = dates[0]?.slice(1, 5) ?? infobox(wt, 'released').match(/\b(19|20)\d\d\b/)?.[0] ?? '';

  const ptPage = entity.sitelinks?.ptwiki?.title;
  const synopsis = (ptPage && (await summary('pt', ptPage))) || (await summary('en', page));

  return {
    source: `${page} (${q})`,
    publisher: infobox(wt, 'publisher') || names('P123'),
    developer: infobox(wt, 'developer') || names('P178'),
    director: infobox(wt, 'director') || names('P57'),
    composer: infobox(wt, 'composer') || names('P86'),
    released: year,
    synopsis,
  };
}
