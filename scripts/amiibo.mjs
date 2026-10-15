/**
 * Turns the amiibo photos into light images for the amiibo shelves.
 *
 *   input:  src/assets/Amiibos/*.png        (the files named in src/data/amiibo.json → "src")
 *   output: src/assets/amiibo/<id>.<hash>.webp, plus src/data/amiibo-sizes.json (figure and base sizes)
 *   (the hash changes with the image, so browsers never show a stale figure after a swap)
 *
 * Run with: npm run amiibo
 */
import { readFile, readdir, mkdir, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const IN = path.join(ROOT, 'src/assets/Amiibos');
const OUT = path.join(ROOT, 'src/assets/amiibo');
const HEIGHT = 360;

const data = JSON.parse(await readFile(path.join(ROOT, 'src/data/amiibo.json'), 'utf8'));
await mkdir(OUT, { recursive: true });
for (const f of await readdir(OUT)) if (f.endsWith('.webp')) await unlink(path.join(OUT, f));

/**
 * Size of the figure and of its base (the widest opaque run in the bottom 6% of rows).
 * Every amiibo base has the same physical size, so the shelf scales figures by it.
 */
async function measure(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let base = [0, 0];
  for (let y = Math.floor(h * 0.94); y < h; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 128) { if (l < 0) l = x; r = x; }
    if (l >= 0 && r - l > base[1] - base[0]) base = [l, r];
  }
  if (base[1] === 0) base = [0, w - 1]; // no base found: treat the whole width as the base
  return { w, h, baseL: base[0], baseR: base[1] };
}

const sizes = {};
const used = new Set();
let n = 0;
for (const series of data.series) {
  for (const item of series.items) {
    used.add(item.src);
    // Trim the transparent margin so every figure stands on the shelf at the same scale.
    const buf = await sharp(path.join(IN, item.src)).trim().resize({ height: HEIGHT, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
    const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8);
    await writeFile(path.join(OUT, `${item.id}.${hash}.webp`), buf);
    sizes[item.id] = await measure(buf);
    n++;
  }
}
await writeFile(path.join(ROOT, 'src/data/amiibo-sizes.json'), JSON.stringify(sizes, null, 1) + '\n');
const unused = (await readdir(IN)).filter((f) => /\.png$/i.test(f) && !used.has(f));
console.log(`${n} amiibos em src/assets/amiibo/`);
if (unused.length) console.log(`\nImagens sem amiibo no amiibo.json (${unused.length}):\n  ${unused.join('\n  ')}`);
