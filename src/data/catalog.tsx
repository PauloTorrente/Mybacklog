import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
}

export type Catalog = Record<string, CatalogEntry>;

export interface Rate {
  rate: number;
  date: string;
  source: string;
}

/** Catalogue key of an amiibo: game ids already start with their console, amiibos get a prefix. */
export const amiiboKey = (id: string) => `amiibo-${id}`;

interface CatalogState {
  catalog: Catalog;
  rate: Rate | null;
  /** False when the backend isn't reachable (e.g. the site is served as static files): prices just don't show. */
  online: boolean;
  setEntry: (id: string, entry: CatalogEntry) => void;
  /** Fetches the catalogue again (it changes while the admin or `npm run catalog:fill` writes to it). */
  refresh: () => void;
}

const CatalogContext = createContext<CatalogState>({ catalog: {}, rate: null, online: false, setEntry: () => {}, refresh: () => {} });

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>({});
  const [rate, setRate] = useState<Rate | null>(null);
  const [online, setOnline] = useState(false);

  const refresh = useCallback(() => {
    fetch('/api/catalog', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((c: Catalog) => (setCatalog(c), setOnline(true)))
      .catch(() => {});
  }, []);

  // Fresh data when the page opens and whenever you come back to the tab.
  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => {
    let alive = true;
    fetch('/api/rates')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((r: Rate) => alive && setRate(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<CatalogState>(
    () => ({
      catalog,
      rate,
      online,
      refresh,
      setEntry: (id, entry) =>
        setCatalog((c) => {
          const next = { ...c };
          if (Object.keys(entry).length) next[id] = entry;
          else delete next[id];
          return next;
        }),
    }),
    [catalog, rate, online, refresh],
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
