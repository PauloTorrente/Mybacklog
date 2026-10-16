/** Game wallpapers downloaded by `npm run wallpapers` (scripts/wallpapers.mjs), keyed by game id. */
const files = import.meta.glob<string>('../assets/wallpapers/*.webp', { eager: true, query: '?url', import: 'default' });

export const wallpapers = new Map<string, string>();
for (const [file, url] of Object.entries(files)) {
  const m = file.match(/\/([^/.]+)(?:\.[0-9a-f]+)?\.webp$/);
  if (m) wallpapers.set(m[1], url);
}
