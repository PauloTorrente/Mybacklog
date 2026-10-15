import raw from './amiibo.json';
import sizes from './amiibo-sizes.json';

/** One figure on the amiibo shelves (photos converted by `npm run amiibo`, see scripts/amiibo.mjs). */
export interface Amiibo {
  id: string;
  name: string;
  /** Which release of the figure, when a character has more than one (e.g. "Super Smash Bros."). */
  line?: string;
  owned: boolean;
  image?: string;
  /** Figures sharing a group stand together: a shelf row never splits them (e.g. Chrom, Robin, Lucina). */
  group?: string;
  /** Size on the shelf in "shelf units", already scaled so every base is the same size (see `fit`). */
  fit: Fit;
}

/**
 * Where a figure sits on the shelf, in shelf units (CSS turns a unit into pixels per screen size).
 * Every amiibo base has the same physical size, so figures are scaled until their bases match:
 * a photo shrunk to fit a tall pose (Rosalina on her chair, Ratha) grows back to its real scale.
 */
export interface Fit {
  width: number;
  height: number;
  /** Centre of the base, from the image's left edge. */
  baseX: number;
  baseWidth: number;
}

const BASE = 185;
type Size = { w: number; h: number; baseL: number; baseR: number };

function fit({ w, h, baseL, baseR }: Size): Fit {
  const k = Math.min(1.25, Math.max(0.9, BASE / Math.max(1, baseR - baseL)));
  return { width: w * k, height: h * k, baseX: ((baseL + baseR) / 2) * k, baseWidth: (baseR - baseL) * k };
}

export interface AmiiboSeries {
  id: string;
  name: string;
  items: Amiibo[];
}

const files = import.meta.glob<string>('../assets/amiibo/*.webp', { eager: true, query: '?url', import: 'default' });
const images = new Map<string, string>();
for (const [file, url] of Object.entries(files)) {
  const m = file.match(/\/([^/]+?)(?:\.[0-9a-f]+)?\.webp$/);
  if (m) images.set(m[1], url);
}

export const amiiboSeries: AmiiboSeries[] = raw.series.map((s) => ({
  id: s.id,
  name: s.name,
  items: s.items.map(({ id, name, owned, ...rest }) => ({
    id,
    name,
    line: 'line' in rest ? rest.line : undefined,
    group: 'group' in rest ? rest.group : undefined,
    owned,
    image: images.get(id),
    fit: fit((sizes as Record<string, Size>)[id] ?? { w: BASE, h: 360, baseL: 0, baseR: BASE }),
  })),
}));

export const amiibos = amiiboSeries.flatMap((s) => s.items);
