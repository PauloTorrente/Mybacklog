import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { formatRange, useCatalog } from '../../data/catalog';
import { amiiboGames, type AmiiboUse } from '../../data/amiiboGames';
import { appearances } from '../../data/appearances';
import { gameTarget } from './infoTargets';

/** What was right-clicked: a game case or an amiibo. */
export interface InfoTarget {
  /** Catalogue key (game id, or amiiboKey(id)). */
  key: string;
  title: string;
  subtitle: string;
  owned: boolean;
  image?: string;
  /** Wide game art for the opening of the strip (see npm run wallpapers). */
  wallpaper?: string;
  kind: 'game' | 'amiibo';
  /** Amiibos: their id, to list the games they work with. */
  amiiboId?: string;
}

interface Open {
  target: InfoTarget;
  x: number;
  y: number;
}

const InfoContext = createContext<(target: InfoTarget, x: number, y: number) => void>(() => {});

const LONG_PRESS_MS = 500;

/**
 * Right-click (or long-press on touch, or the ContextMenu key) on a case or an amiibo
 * opens a small 3D card with the catalogued details: credits, synopsis and the price estimate.
 */
export function useInfoTrigger(target: InfoTarget) {
  const open = useContext(InfoContext);
  const timer = useRef<number | undefined>(undefined);
  const pressed = useRef(false);

  const cancel = () => window.clearTimeout(timer.current);
  return {
    /** For a visible "Detalhes" button: opens the strip next to the element. */
    openFrom: (el: Element) => {
      const r = el.getBoundingClientRect();
      open(target, r.left + r.width / 2, r.top + r.height / 2);
    },
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      open(target, e.clientX, e.clientY);
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pressed.current = false;
      const { clientX, clientY } = e;
      timer.current = window.setTimeout(() => {
        pressed.current = true;
        open(target, clientX, clientY);
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerMove: (e: PointerEvent) => {
      if (e.pointerType === 'touch' && (Math.abs(e.movementX) > 4 || Math.abs(e.movementY) > 4)) cancel();
    },
    /** True right after a long-press opened the card, so the tap's click can be ignored. */
    consumeLongPress: () => {
      const was = pressed.current;
      pressed.current = false;
      return was;
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        open(target, r.left + r.width / 2, r.top + r.height / 2);
      }
    },
  };
}

/**
 * "Detalhes": the visible way into the strip (right-click and long-press are shortcuts nobody guesses).
 * Shows on hover/focus with a mouse; always visible on touch screens.
 */
export const DetailsButton = styled.button`
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem 0.25rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #fff;
  background: rgba(19, 118, 111, 0.92);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  box-shadow: 0 6px 14px rgba(15, 30, 55, 0.25);
  cursor: pointer;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.18s, transform 0.18s;

  svg { width: 13px; height: 13px; }
  *:hover > &, &:focus-visible { opacity: 1; transform: none; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aqua}; outline-offset: 2px; }
  @media (hover: none) { opacity: 1; transform: none; }
`;

export const InfoIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="7.2" y="7" width="1.6" height="4.6" rx="0.8" fill="currentColor" />
    <circle cx="8" cy="4.6" r="1" fill="currentColor" />
  </svg>
);

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 30, 55, 0.28);
`;

/** Spans the whole width of the screen; its height follows the content (never the full screen). */
const Holder = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  z-index: 51;
  perspective: 1400px;
`;

const Band = styled(motion.section)`
  position: relative;
  overflow: hidden;
  transform-origin: 50% 0%;
  background: linear-gradient(170deg, #f7fbff, #e8f3ff);
  border-top: 1px solid #fff;
  border-bottom: 1px solid #fff;
  box-shadow:
    0 -2px 0 rgba(78, 205, 196, 0.5),
    0 30px 70px rgba(15, 30, 55, 0.35);
  color: ${({ theme }) => theme.color.ink};

  &:focus-visible { outline: none; box-shadow: 0 0 0 3px ${({ theme }) => theme.color.aquaRing}, 0 30px 70px rgba(15, 30, 55, 0.35); }
`;

/** The game's art fills the band first, then fades into a faint backdrop as the details come in. */
const Hero = styled(motion.div)`
  position: absolute;
  inset: 0;
  pointer-events: none;

  img.wall { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
  /* Without a wallpaper: a deep gradient in the shelf's colours behind the sharp cover. */
  &.plain { background: radial-gradient(120% 120% at 30% 20%, #2a8fbf 0%, #13355c 70%); }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(10, 20, 40, 0.65) 0%, rgba(10, 20, 40, 0.1) 55%);
  }
`;

/** The art itself, sharp and big in the middle of the band, before it gives way to the details. */
const Showcase = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 4vw, 3rem);
  padding: 1.5rem 16px;

  &.over-wall {
    justify-content: flex-start;
    align-items: flex-end;
    padding: 1.5rem max(16px, calc((100vw - 1120px) / 2)) 1.8rem;
  }
  pointer-events: none;

  img { height: min(88%, 420px); max-width: 45vw; object-fit: contain; filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45)); }
  img.game { border-radius: 10px; }
  h2 {
    margin: 0;
    max-width: 40vw;
    font-size: clamp(1.6rem, 4.5vw, 3.2rem);
    font-weight: 700;
    line-height: 1.1;
    color: #fff;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.55);
  }
`;

const Content = styled(motion.div)`
  position: relative;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.6rem 16px 1.8rem;
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 1.5rem 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.bp.md}) {
    grid-template-columns: 120px minmax(0, 1fr);
    .synopsis { grid-column: 1 / -1; }
  }
  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    grid-template-columns: minmax(0, 1fr);
    padding-top: 3.5rem;
    > :first-child { width: 120px; }
  }
`;

const Art = styled(motion.div)`
  perspective: 600px;
  img {
    display: block;
    width: 100%;
    border-radius: 8px;
    transform: rotateY(-14deg);
    box-shadow: 14px 18px 30px rgba(15, 30, 55, 0.3);
  }
  img.amiibo { box-shadow: none; transform: none; filter: drop-shadow(0 14px 18px rgba(15, 30, 55, 0.3)); }
`;

const Main = styled.div`
  min-width: 0;
  h2 { font-size: clamp(1.4rem, 3vw, 2rem); line-height: 1.15; font-weight: 700; margin: 0; }
  .sub { color: ${({ theme }) => theme.color.muted}; margin-top: 0.25rem; }
  .chip {
    display: inline-block;
    margin-top: 0.6rem;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .chip.owned { background: ${({ theme }) => theme.color.aquaSoft}; color: ${({ theme }) => theme.color.aquaInk}; }
  .chip.wish { background: rgba(148, 163, 184, 0.18); color: ${({ theme }) => theme.color.muted}; }
`;

const Price = styled.div`
  margin-top: 1rem;
  display: inline-grid;
  gap: 0.1rem;
  padding: 0.75rem 1.1rem;
  border-radius: 1rem;
  color: #fff;
  background: linear-gradient(120deg, #13766f, #2a8fbf);
  box-shadow: 0 12px 26px rgba(19, 118, 111, 0.28);

  .label { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; font-weight: 700; }
  .brl { font-family: ${({ theme }) => theme.font.heading}; font-size: 1.6rem; font-weight: 700; line-height: 1.1; }
  .eur { font-size: 0.9rem; opacity: 0.9; }
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
  margin: 1.1rem 0 0;
  font-size: 0.9rem;

  dt { color: ${({ theme }) => theme.color.muted}; }
  dd { margin: 0; font-weight: 700; overflow-wrap: anywhere; }
`;

const Synopsis = styled.div`
  font-size: 0.95rem;
  line-height: 1.6;


  h3 { margin: 0 0 0.4rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.color.aquaInk}; }
  p { margin: 0; }
  .empty { color: ${({ theme }) => theme.color.muted}; }
`;

const USE_LABEL: Record<AmiiboUse, string> = { figure: 'como boneco', character: 'como personagem', series: 'pela série' };

/** Left column of an amiibo: the console games the character appears in. Yours are links to their details. */
const Appears = styled.div`
  margin-top: 1.1rem;
  h3 { margin: 0 0 0.5rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.color.aquaInk}; }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.15rem; }
  li { display: grid; grid-template-columns: 2.6rem 1fr; align-items: baseline; gap: 0.6rem; font-size: 0.88rem; line-height: 1.35; }
  .y { font-family: ${({ theme }) => theme.font.mono}; font-size: 0.75rem; color: ${({ theme }) => theme.color.muted}; }
  .t { color: ${({ theme }) => theme.color.muted}; }
  button {
    justify-self: start;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 700;
    color: ${({ theme }) => theme.color.aquaInk};
    text-align: left;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-color: rgba(19, 118, 111, 0.35);
    text-underline-offset: 3px;
  }
  button::after { content: ' ›'; }
  button:hover { text-decoration-color: currentColor; }
  button:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aqua}; outline-offset: 2px; border-radius: 4px; }
`;

function AmiiboAppears({ id }: { id: string }) {
  const open = useContext(InfoContext);
  const list = appearances(id);
  if (!list.length) return null;
  return (
    <Appears>
      <h3>Aparece em</h3>
      <ol>
        {list.map((a) => (
          <li key={a.title}>
            <span className="y">{a.year}</span>
            {a.game ? (
              <button
                type="button"
                title="Ver detalhes do jogo"
                onClick={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  open(gameTarget(a.game!), r.left, r.top);
                }}
              >
                {a.title}
              </button>
            ) : (
              <span className="t">{a.title}</span>
            )}
          </li>
        ))}
      </ol>
    </Appears>
  );
}

/** Right column of an amiibo: what it does in each game. */
const Uses = styled.div`
  font-size: 0.9rem;
  h3 { margin: 0 0 0.6rem; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: ${({ theme }) => theme.color.aquaInk}; }
  > ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
  > ul > li { padding: 0.55rem 0.75rem; border-radius: 0.8rem; background: rgba(255, 255, 255, 0.72); border: 1px solid rgba(148, 163, 184, 0.25); }
  > ul > li.mine { border-color: rgba(78, 205, 196, 0.6); background: rgba(232, 250, 248, 0.92); }
  .row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.2rem 0.5rem; }
  .t { font-weight: 700; }
  .meta { font-size: 0.72rem; color: ${({ theme }) => theme.color.muted}; }
  .does { margin: 0.3rem 0 0; padding-left: 1.1rem; line-height: 1.45; }
  .saves { margin-top: 0.2rem; font-size: 0.72rem; color: ${({ theme }) => theme.color.muted}; }
  a { display: inline-block; margin-top: 0.6rem; color: ${({ theme }) => theme.color.aquaInk}; font-size: 0.78rem; }
`;

function AmiiboUses({ id }: { id: string }) {
  const { url, list } = amiiboGames(id);
  if (!list.length) return <p className="empty">Ainda sem jogos compatíveis catalogados.</p>;
  return (
    <Uses>
      <h3>O que ele faz em cada jogo</h3>
      <ul>
        {list.map((g) => (
          <li key={`${g.use}-${g.platform}-${g.title}`} className={g.game ? 'mine' : undefined}>
            <div className="row">
              <span className="t">{g.game?.title ?? g.title}</span>
              <span className="meta">
                {g.platform} · {USE_LABEL[g.use]}
                {g.game ? (g.game.status === 'owned' ? ' · você tem' : ' · lista de desejos') : ''}
              </span>
            </div>
            <ul className="does">
              {g.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            {g.saves && <div className="saves">Grava dados no amiibo</div>}
          </li>
        ))}
      </ul>
      {url && (
        <a href={url} target="_blank" rel="noreferrer">
          Fonte: amiibo.life
        </a>
      )}
    </Uses>
  );
}

const Back = styled.button`
  position: absolute;
  top: 0.9rem;
  right: calc(max(16px, calc((100vw - 1120px) / 2)) + 52px);
  z-index: 2;
  height: 40px;
  padding: 0 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  color: ${({ theme }) => theme.color.aquaInk};
  font-weight: 700;
  cursor: pointer;
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 2px; }
`;

const Close = styled.button`
  position: absolute;
  top: 0.9rem;
  right: max(16px, calc((100vw - 1120px) / 2));
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 1rem;
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 2px; }
`;

/** How long the art holds the stage before the details take over. */
const HOLD = 0.55;

function InfoCard({ open, onClose, back, onBack }: { open: Open; onClose: () => void; back?: string; onBack: () => void }) {
  const { catalog, rate } = useCatalog();
  const { target, y } = open;
  const entry = catalog[target.key];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [target.key]);

  // The band sits around the click, but always fully on screen.
  const height = Math.min(window.innerHeight - 24, 520);
  const top = Math.max(12, Math.min(y - height / 3, window.innerHeight - height - 12));

  const facts: [string, string | undefined][] = [
    ['Distribuidora', entry?.publisher],
    ['Desenvolvedora', entry?.developer],
    ['Lançamento', entry?.released],
    ['Direção', entry?.director],
    ['Trilha sonora', entry?.composer],
  ];
  const shown = facts.filter(([, v]) => v);
  const eur = formatRange(entry?.priceMin, entry?.priceMax, 'EUR');
  const brl = rate ? formatRange(entry?.priceMin, entry?.priceMax, 'BRL', rate.rate) : null;
  const item = (i: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: HOLD + 0.1 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <Holder style={{ top }}>
      <Band
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Informações de ${target.title}`}
        tabIndex={-1}
        style={{ maxHeight: height, overflowY: 'auto' }}
        initial={{ rotateX: -80, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ rotateX: -60, opacity: 0, transition: { duration: 0.22 } }}
        transition={{ type: 'spring', stiffness: 170, damping: 20 }}
      >
        {/* The art fills the strip first, then fades into a faint backdrop as the details come in. */}
        <Hero className={target.wallpaper ? undefined : 'plain'} initial={{ opacity: 1 }} animate={{ opacity: target.wallpaper ? 0.14 : 0 }} transition={{ delay: HOLD, duration: 0.9, ease: 'easeInOut' }}>
          {target.wallpaper && <img className="wall" src={target.wallpaper} alt="" />}
        </Hero>
        <Showcase
          aria-hidden="true"
          className={target.wallpaper ? 'over-wall' : undefined}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -12 }}
          transition={{ delay: HOLD, duration: 0.5, ease: 'easeIn' }}
        >
          {!target.wallpaper && target.image && <img className={target.kind} src={target.image} alt="" />}
          <h2>{target.title}</h2>
        </Showcase>
        <Close type="button" aria-label="Fechar" onClick={onClose}>✕</Close>
        {back && (
          <Back type="button" onClick={onBack}>
            ← Voltar para {back}
          </Back>
        )}

        <Content style={{ minHeight: Math.min(height, 300) }}>
          <Art {...item(0)}>{target.image && <img className={target.kind} src={target.image} alt="" />}</Art>
          <Main>
            <motion.div {...item(1)}>
              <h2>{target.title}</h2>
              <div className="sub">{target.subtitle}</div>
              <span className={`chip ${target.owned ? 'owned' : 'wish'}`}>{target.owned ? 'Na coleção' : 'Lista de desejos'}</span>
            </motion.div>
            {target.kind === 'amiibo' && target.amiiboId && (
              <motion.div {...item(2)}>
                <AmiiboAppears id={target.amiiboId} />
              </motion.div>
            )}
            {eur && (
              <motion.div {...item(2)}>
                <Price>
                  <span className="label">{target.owned ? 'Preço de referência' : 'Estimativa · usado na Espanha'}</span>
                  <span className="brl">{brl ?? eur}</span>
                  {brl && <span className="eur">{eur}</span>}
                </Price>
              </motion.div>
            )}
            {shown.length > 0 && (
              <motion.div {...item(3)}>
                <Facts>
                  {shown.map(([k, v]) => (
                    <div key={k} style={{ display: 'contents' }}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </Facts>
              </motion.div>
            )}
          </Main>
          <motion.div className="synopsis" {...item(4)}>
            <Synopsis>
              {target.kind === 'amiibo' && target.amiiboId ? (
                <AmiiboUses id={target.amiiboId} />
              ) : (
                <>
                  <h3>Sinopse</h3>
                  {entry?.synopsis ? <p>{entry.synopsis}</p> : <p className="empty">Ainda sem sinopse catalogada.</p>}
                </>
              )}
            </Synopsis>
          </motion.div>
        </Content>
      </Band>
    </Holder>
  );
}

export function InfoMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  // Strips opened from inside a strip (a game from an amiibo's list) stack up, so you can go back.
  const [history, setHistory] = useState<Open[]>([]);
  const current = useRef<Open | null>(null);
  current.current = open;
  const opener = useRef<Element | null>(null);

  const { refresh } = useCatalog();
  const show = useCallback(
    (target: InfoTarget, x: number, y: number) => {
      const prev = current.current;
      if (prev) setHistory((h) => [...h, prev]);
      else opener.current = document.activeElement;
      setOpen({ target, x, y });
      refresh(); // details may have been added since the page loaded
    },
    [refresh],
  );
  const close = useCallback(() => {
    setOpen(null);
    setHistory([]);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);
  const back = useCallback(() => {
    setHistory((h) => {
      setOpen(h.at(-1) ?? null);
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close();
    const onScroll = () => close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open, close]);

  const value = useMemo(() => show, [show]);
  return (
    <InfoContext.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div key="info" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              <Backdrop
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={close}
                onContextMenu={(e) => {
                  e.preventDefault();
                  close();
                }}
              />
              <InfoCard key={open.target.key} open={open} onClose={close} back={history.at(-1)?.target.title} onBack={back} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </InfoContext.Provider>
  );
}
