import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import catalogData from './catalog.json';

/** What the admin types for a game or amiibo (see server/store.mjs). Prices are in euros, second-hand in Spain. */
export interface CatalogEntry {
  priceMin?: number;
  priceMax?: number;
  publisher?: string;
  developer?: string;
  released?: string;
  director?: string;
  composer?: string;
  synopsis?: string;
  /** How much I want it: S (most) to D (least). */
  tier?: Tier;
}

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

/** What each level of desire means, shown next to the badge and in the admin. */
export const TIER_LABEL: Record<Tier, string> = {
  S: 'Preciso ter',
  A: 'Quero muito',
  B: 'Quero',
  C: 'Quando der',
  D: 'Sem pressa',
};

export type Catalog = Record<string, CatalogEntry>;

export interface Rate {
  rate: number;
  date: string;
  source: string;
}

/** The site ships with all its data, so it works with no backend. */
const BUNDLED = catalogData as unknown as Catalog;

/** Used until the live rate arrives, and if the rate API is down. */
const FALLBACK_RATE: Rate = { rate: 6.1449, date: '2026-11-06', source: 'Banco Central Europeu (frankfurter.dev)' };

/** Only where edits must show without a rebuild (`npm run dev` and the admin); the public site just uses BUNDLED. */
const LIVE = import.meta.env.DEV || window.location.pathname.startsWith('/admin');

/** Catalogue key of an amiibo: game ids already start with their console, amiibos get a prefix. */
export const amiiboKey = (id: string) => `amiibo-${id}`;

interface CatalogState {
  catalog: Catalog;
  rate: Rate;
  setEntry: (id: string, entry: CatalogEntry) => void;
  /** Picks up edits saved by the admin while developing; does nothing on the public site. */
  refresh: () => void;
}

const CatalogContext = createContext<CatalogState>({ catalog: BUNDLED, rate: FALLBACK_RATE, setEntry: () => {}, refresh: () => {} });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(BUNDLED);
  const [rate, setRate] = useState<Rate>(FALLBACK_RATE);

  const refresh = useCallback(() => {
    if (!LIVE) return;
    fetch('/api/catalog', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((c: Catalog) => setCatalog(c))
      .catch(() => {});
  }, []);

  // While developing: fresh data when the page opens and whenever you come back to the tab.
  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => {
    let alive = true;
    fetch('https://api.frankfurter.dev/v1/latest?from=EUR&to=BRL')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((r: { rates: { BRL: number }; date: string }) => alive && setRate({ ...FALLBACK_RATE, rate: r.rates.BRL, date: r.date }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<CatalogState>(
    () => ({
      catalog,
      rate,
      refresh,
      setEntry: (id, entry) =>
        setCatalog((c) => {
          const next = { ...c };
          if (Object.keys(entry).length) next[id] = entry;
          else delete next[id];
          return next;
        }),
    }),
    [catalog, rate, refresh],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);

/** Middle of a price range, or the single price given. */
export function midPrice(e?: CatalogEntry): number | null {
  if (!e) return null;
  const { priceMin: a, priceMax: b } = e;
  if (a !== undefined && b !== undefined) return (a + b) / 2;
  return a ?? b ?? null;
}

const eur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** "€ 20–30", or "€ 25" when only one price is set. */
export function formatRange(min: number | undefined, max: number | undefined, currency: 'EUR' | 'BRL', rate = 1): string | null {
  const f = currency === 'EUR' ? eur : brl;
  const k = currency === 'EUR' ? 1 : rate;
  if (min !== undefined && max !== undefined && min !== max) return `${f.format(min * k)}–${f.format(max * k).replace(/^[^\d]+/, '')}`;
  const one = min ?? max;
  return one === undefined ? null : f.format(one * k);
}
