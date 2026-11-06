import { describe, expect, it } from 'vitest';
import data from './catalog.json';
import { TIER_LABEL, type CatalogEntry } from './catalog';

const entries = Object.entries(data as Record<string, CatalogEntry>);

describe('bundled catalogue', () => {
  it('ships with the site', () => {
    expect(entries.length).toBeGreaterThan(200);
    expect((data as Record<string, CatalogEntry>)['switch-persona-3-reload'].tier).toBe('S');
  });

  it('only uses known levels of desire', () => {
    const bad = entries.filter(([, e]) => e.tier && !(e.tier in TIER_LABEL)).map(([id]) => id);
    expect(bad).toEqual([]);
  });
});
