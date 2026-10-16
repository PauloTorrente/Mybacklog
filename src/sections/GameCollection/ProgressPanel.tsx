import { useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import styled from 'styled-components';
import { amiibos } from '../../data/amiibo';
import { amiiboKey, midPrice, useCatalog, type Catalog } from '../../data/catalog';
import { games, platforms, type ShelfId } from '../../data/games';
import { PlatformMark } from './PlatformMark';

const eur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Owned/total plus what the missing items would cost (sum of the middle of each catalogued price range). */
function tally(items: { key: string; owned: boolean }[], catalog: Catalog) {
  const owned = items.filter((i) => i.owned).length;
  const missing = items.filter((i) => !i.owned);
  const prices = missing.map((i) => midPrice(catalog[i.key])).filter((p): p is number => p !== null);
  return { owned, total: items.length, cost: prices.reduce((a, b) => a + b, 0), priced: prices.length, missing: missing.length };
}

const gameItems = games.map((g) => ({ key: g.id, owned: g.status === 'owned', platform: g.platformId as ShelfId }));
const amiiboItems = amiibos.map((a) => ({ key: amiiboKey(a.id), owned: a.owned, platform: 'amiibo' as ShelfId }));

/** Everything the panel and its button show, from the current catalogue. */
export function useProgress() {
  const { catalog, rate, online } = useCatalog();
  const all = tally([...gameItems, ...amiiboItems], catalog);
  const g = tally(gameItems, catalog);
  const am = tally(amiiboItems, catalog);
  const shelves = [
    ...platforms.map((p) => ({ id: p.id as ShelfId, name: p.name, t: tally(gameItems.filter((i) => i.platform === p.id), catalog) })),
    { id: 'amiibo' as ShelfId, name: 'Amiibos', t: am },
  ];
  return { all, games: g, amiibos: am, shelves, rate, online };
}

/** A ring that fills up to `value`% when it appears. */
function Ring({ value, size, stroke, delay = 0, track = 'rgba(148, 163, 184, 0.18)' }: { value: number; size: number; stroke: number; delay?: number; track?: string }) {
  const r = (size - stroke) / 2;
  const id = `ring-${size}-${stroke}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)', flex: 'none' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FB8FF" />
          <stop offset="1" stopColor="#4ECDC4" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: Math.max(0.001, value / 100) }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** A number that counts up from zero when it appears. */
function CountUp({ to, format = (n: number) => String(Math.round(n)), delay = 0 }: { to: number; format?: (n: number) => string; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, delay, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [to, delay]);
  return <>{format(v)}</>;
}

/* ---------------- Trigger (in the header) ---------------- */

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.45rem 1.1rem 0.45rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #fff;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.92), rgba(225, 245, 255, 0.85));
  box-shadow: 0 8px 24px rgba(30, 64, 120, 0.1);
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(30, 64, 120, 0.16); }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 3px; }

  .ring { position: relative; display: grid; place-items: center; }
  .ring b { position: absolute; font-family: ${({ theme }) => theme.font.heading}; font-size: 0.78rem; color: ${({ theme }) => theme.color.ink}; }
  .t { display: block; font-family: ${({ theme }) => theme.font.heading}; font-weight: 700; font-size: 1rem; color: ${({ theme }) => theme.color.ink}; }
  .s { display: block; font-size: 0.8rem; color: ${({ theme }) => theme.color.muted}; }
`;

export function ProgressButton({ onOpen }: { onOpen: () => void }) {
  const { all, rate } = useProgress();
  const p = pct(all.owned, all.total);
  const left = all.priced ? (rate ? brl.format(all.cost * rate.rate) : eur.format(all.cost)) : null;
  return (
    <TriggerButton type="button" aria-haspopup="dialog" onClick={onOpen}>
      <span className="ring">
        <Ring value={p} size={44} stroke={5} />
        <b>{p}%</b>
      </span>
      <span>
        <span className="t">Progresso da coleção</span>
        <span className="s">
          {all.owned} de {all.total} itens{left ? ` · faltam ≈ ${left}` : ''}
        </span>
      </span>
    </TriggerButton>
  );
}

/* ---------------- Panel ---------------- */

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 30, 55, 0.38);
  display: grid;
  place-items: center;
  padding: 16px;
  perspective: 1200px;
`;

const Dialog = styled(motion.div)`
  width: min(880px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  border-radius: 1.75rem;
  background:
    radial-gradient(120% 60% at 100% 0%, rgba(127, 184, 255, 0.28), transparent 60%),
    radial-gradient(80% 50% at 0% 0%, rgba(78, 205, 196, 0.22), transparent 60%),
    linear-gradient(175deg, #ffffff, #f2f8ff);
  border: 1px solid #fff;
  box-shadow: 0 40px 80px rgba(15, 30, 55, 0.3);
  padding: clamp(1.1rem, 3vw, 2rem);
  color: ${({ theme }) => theme.color.ink};

  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 3px; }
  h2 { font-size: clamp(1.4rem, 3.5vw, 1.9rem); font-weight: 700; margin: 0; }
  h3 { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.color.aquaInk}; margin: 1.8rem 0 0.8rem; }
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  button {
    margin-left: auto;
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.color.line}; background: #fff; cursor: pointer; font-size: 1rem;
  }
  button:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 2px; }
`;

const Big = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.4rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const BigTile = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #fff;
  box-shadow: 0 10px 24px rgba(30, 64, 120, 0.08);

  .ring { position: relative; display: grid; place-items: center; }
  .ring b { position: absolute; font-family: ${({ theme }) => theme.font.heading}; font-size: 1.35rem; }
  .k { font-weight: 700; font-size: 1.05rem; }
  .s { font-size: 0.85rem; color: ${({ theme }) => theme.color.muted}; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  @media (max-width: 760px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 420px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  gap: 0.75rem;
`;

const Shelf = styled(motion.div)`
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 0.9rem 0.6rem 0.8rem;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid #fff;
  text-align: center;

  .logo { height: 30px; display: grid; place-items: center; }
  .ring { position: relative; display: grid; place-items: center; }
  .ring b { position: absolute; font-family: ${({ theme }) => theme.font.heading}; font-size: 0.95rem; }
  .n { font-size: 0.85rem; color: ${({ theme }) => theme.color.muted}; }
  .n b { color: ${({ theme }) => theme.color.ink}; }
  .c { font-size: 0.75rem; color: ${({ theme }) => theme.color.aquaInk}; font-weight: 700; min-height: 1em; }
`;

const Cost = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1.5rem;
  align-items: end;
  padding: 1.4rem 1.5rem;
  border-radius: 1.4rem;
  color: #fff;
  background: linear-gradient(120deg, #13766f 0%, #2a8fbf 100%);
  box-shadow: 0 18px 40px rgba(19, 118, 111, 0.3);

  .label { grid-column: 1 / -1; font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85; font-weight: 700; }
  .brl { font-family: ${({ theme }) => theme.font.heading}; font-size: clamp(2rem, 6vw, 3rem); font-weight: 700; line-height: 1; }
  .eur { font-size: 1.1rem; opacity: 0.9; font-weight: 700; text-align: right; }
  p { grid-column: 1 / -1; margin: 0.4rem 0 0; font-size: 0.82rem; opacity: 0.88; line-height: 1.45; }
  .bar { grid-column: 1 / -1; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.25); overflow: hidden; margin-top: 0.4rem; }
  .bar span { display: block; height: 100%; border-radius: 999px; background: #fff; }
`;

export function ProgressPanel({ onClose }: { onClose: () => void }) {
  const { all, games: g, amiibos: am, shelves, rate, online } = useProgress();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const big = [
    { k: 'Geral', t: all, unit: 'itens' },
    { k: 'Jogos', t: g, unit: 'jogos' },
    { k: 'Amiibos', t: am, unit: 'amiibos' },
  ];

  return (
    <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <Dialog
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, rotateX: -14, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Top>
          <h2 id="progress-title">Progresso da coleção</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>✕</button>
        </Top>

        <Big>
          {big.map(({ k, t, unit }, i) => (
            <BigTile key={k} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
              <span className="ring">
                <Ring value={pct(t.owned, t.total)} size={86} stroke={9} delay={0.15 + i * 0.08} />
                <b><CountUp to={pct(t.owned, t.total)} delay={0.15 + i * 0.08} />%</b>
              </span>
              <span>
                <span className="k">{k}</span>
                <br />
                <span className="s">{t.owned} de {t.total} {unit}</span>
              </span>
            </BigTile>
          ))}
        </Big>

        <h3>Por estante</h3>
        <Grid>
          {shelves.map(({ id, name, t }, i) => (
            <Shelf key={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} aria-label={`${name}: ${t.owned} de ${t.total}`}>
              <span className="logo"><PlatformMark id={id} size={26} /></span>
              <span className="ring">
                <Ring value={pct(t.owned, t.total)} size={64} stroke={7} delay={0.35 + i * 0.05} />
                <b>{pct(t.owned, t.total)}%</b>
              </span>
              <span className="n"><b>{t.owned}</b> de {t.total}</span>
              <span className="c">{t.priced ? `faltam ≈ ${rate ? brl.format(t.cost * rate.rate) : eur.format(t.cost)}` : ''}</span>
            </Shelf>
          ))}
        </Grid>

        <h3>Quanto falta para completar</h3>
        <Cost initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="label">Estimativa da lista de desejos</span>
          {all.priced > 0 ? (
            <>
              <span className="brl">
                {rate ? <CountUp to={all.cost * rate.rate} format={(n) => brl.format(n)} delay={0.55} /> : eur.format(all.cost)}
              </span>
              <span className="eur">{eur.format(all.cost)}</span>
              <span className="bar" aria-hidden="true"><span style={{ width: `${pct(all.priced, all.missing)}%` }} /></span>
              <p>
                {all.priced} de {all.missing} itens já têm preço
                {all.priced < all.missing ? ', então o total real é maior' : ''}. Preços de usados na Espanha, somando o meio de cada faixa.
                {rate && ` Cotação: € 1 = R$ ${rate.rate.toFixed(2).replace('.', ',')} (${rate.date.split('-').reverse().join('/')}, Banco Central Europeu).`}
              </p>
            </>
          ) : (
            <p>{online ? 'Nenhum preço cadastrado ainda. Os preços entram pela área de admin.' : 'Os preços aparecem quando o servidor está ligado.'}</p>
          )}
        </Cost>
      </Dialog>
    </Backdrop>
  );
}
