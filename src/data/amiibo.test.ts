import { describe, expect, it } from 'vitest';
import { amiibos, amiiboSeries } from './amiibo';
import { parseFilters } from '../sections/GameCollection/useGameFilters';

describe('amiibo shelves', () => {
  it('has 51 figures in 8 series, 13 of them owned', () => {
    expect(amiiboSeries).toHaveLength(8);
    expect(amiibos).toHaveLength(51);
    expect(amiibos.filter((a) => a.owned)).toHaveLength(13);
  });

  it('has an image for every figure and unique ids', () => {
    expect(amiibos.filter((a) => !a.image).map((a) => a.id)).toEqual([]);
    expect(new Set(amiibos.map((a) => a.id)).size).toBe(amiibos.length);
  });

  it('opens from a link', () => {
    expect(parseFilters('?console=amiibo').platform).toBe('amiibo');
  });
});

describe('amiibo groups', () => {
  it('keeps Chrom (Fire Emblem), Robin and Lucina next to each other, in that order', () => {
    const fe = amiiboSeries.find((s) => s.id === 'fire-emblem')!.items;
    const i = fe.findIndex((a) => a.id === 'chrom');
    expect(fe.slice(i, i + 3).map((a) => [a.id, a.group])).toEqual([['chrom', 'awakening'], ['robin', 'awakening'], ['lucina', 'awakening']]);
  });
});

describe('amiibo couples', () => {
  it('stands Celica and Alm together, Celica on the left so the swords point outward', () => {
    const fe = amiiboSeries.find((s) => s.id === 'fire-emblem')!.items;
    const i = fe.findIndex((a) => a.id === 'celica');
    expect(fe.slice(i, i + 2).map((a) => [a.id, a.group])).toEqual([['celica', 'alm-celica'], ['alm', 'alm-celica']]);
  });

  it('scales every figure so the bases match', () => {
    for (const a of amiibos) expect(a.fit.baseWidth).toBeGreaterThan(150);
  });
});

