import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Covers stay separate files (lazy-loaded per shelf) instead of being inlined into the JS bundle.
    assetsInlineLimit: (file) => (file.includes('/assets/covers/') || file.includes('/assets/amiibo/') ? false : undefined),
    // ~700 cover URLs plus React/Framer Motion: ~170 kB gzipped is expected, not a bundling mistake.
    chunkSizeWarningLimit: 650,
  },
  test: {
    // The persistent module cache keys on file content, so a glob over generated images
    // (covers, amiibo) stays stale after `npm run covers` / `npm run amiibo` adds files.
    fsModuleCache: false,
  },
});
