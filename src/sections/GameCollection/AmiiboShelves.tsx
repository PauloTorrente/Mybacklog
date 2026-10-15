import { useEffect, useRef, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styled from 'styled-components';
import { amiiboSeries, type Amiibo } from '../../data/amiibo';
import { useI18n } from '../../i18n/I18nProvider';
import { PlatformMark } from './PlatformMark';
import { glass } from './styles';

/** Space between two figures, and between figures of the same group (a couple, a trio), in shelf units. */
const GAP = 22;
const GROUP_GAP = 6;

const Groups = styled.div`
  display: grid;
  gap: 2.25rem;
`;

const Group = styled.section`
  display: grid;
  gap: 0.9rem;
`;

const SeriesCard = styled.header`
  ${glass};
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.25rem;

  h3 { flex: 1; min-width: 0; font-size: clamp(1.15rem, 3vw, 1.45rem); font-weight: 700; }
  .stats { font-size: 0.85rem; color: ${({ theme }) => theme.color.muted}; text-align: right; }
  .stats b { color: ${({ theme }) => theme.color.ink}; }

  /* Phones: logo + series name on the first line, the count under them. */
  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    flex-wrap: wrap;
    gap: 0.4rem 0.75rem;
    .stats { flex-basis: 100%; text-align: left; }
  }
`;

/**
 * Glass shelves like the game shelves: every row is a plank painted as a repeating background.
 * Sizes are in shelf units (--u = pixels per unit): figures are measured from their photos so
 * every base is the same size, and each figure takes exactly its own width on the plank.
 */
const Shelf = styled.ul`
  --u: 0.44;
  --fig: calc(var(--u) * var(--tallest) * 1px + 0.5rem);
  --caption: 44px;
  --row: calc(var(--fig) + 14px + var(--caption));

  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    --u: 0.33;
  }

  /* Rows are centred, so a short series stands in the middle of the shelf instead of hugging the left. */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 0;
  padding: 0 0.5rem;
  background-image: linear-gradient(
    to bottom,
    transparent var(--fig),
    rgba(255, 255, 255, 0.95) var(--fig),
    rgba(240, 248, 255, 0.95) calc(var(--fig) + 8px),
    rgba(190, 210, 230, 0.9) calc(var(--fig) + 8px),
    rgba(190, 210, 230, 0.9) calc(var(--fig) + 13px),
    rgba(30, 64, 120, 0.1) calc(var(--fig) + 13px),
    transparent calc(var(--fig) + 20px)
  );
  background-size: 100% var(--row);
  border-radius: 0.75rem;
`;

/** A set of figures that must stay on the same row, standing closer together (see `group` in amiibo.json). */
const Bundle = styled.li`
  list-style: none;
  flex: none;

  > ul { display: flex; margin: 0; padding: 0; }
`;

/** One figure's place on the plank: its own width plus half a gap on each side. */
const Slot = styled(motion.li)`
  list-style: none;
  flex: none;
  position: relative;
  width: calc(var(--u) * (var(--w) + var(--gap)) * 1px);
  height: var(--row);
  perspective: 600px;
`;

const Stage = styled.div<{ $wish: boolean }>`
  position: absolute;
  left: calc(var(--u) * var(--gap) / 2 * 1px);
  bottom: calc(var(--row) - var(--fig));
  width: calc(var(--u) * var(--w) * 1px);
  height: calc(var(--u) * var(--h) * 1px);
  /* Figures you don't have yet stand "switched off", like the games. */
  opacity: ${({ $wish }) => ($wish ? 0.45 : 1)};
  filter: ${({ $wish }) => ($wish ? 'grayscale(1)' : 'none')};

  /* Floor shadow, right under the base. */
  &::after {
    content: '';
    position: absolute;
    left: calc(var(--u) * (var(--bx) - var(--bw) / 2) * 1px);
    width: calc(var(--u) * var(--bw) * 1px);
    bottom: -5px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(30, 64, 120, 0.32), transparent);
    pointer-events: none;
  }
`;

const Figure = styled(motion.img)`
  display: block;
  width: 100%;
  height: 100%;
  will-change: transform;
`;

/** The name sits under the base, not under the middle of the photo (a sword held out moves the middle). */
const Caption = styled.div`
  position: absolute;
  top: calc(var(--fig) + 14px);
  left: calc(var(--u) * (var(--gap) / 2 + var(--bx)) * 1px);
  transform: translateX(-50%);
  width: max-content;
  max-width: 8.5rem;
  padding-top: 0.3rem;
  text-align: center;
  line-height: 1.2;

  .name { display: block; font-weight: 700; font-size: 0.85rem; color: ${({ theme }) => theme.color.ink}; }
  .line { display: block; font-size: 0.72rem; color: ${({ theme }) => theme.color.muted}; }
`;

/** One figure: tilts towards the pointer around its base (a fake turn, the photo is 2D) and hops up a little. */
function AmiiboFigure({ amiibo, index, reveal, gap }: { amiibo: Amiibo; index: number; reveal: boolean; gap: number }) {
  const { t } = useI18n();
  const x = useMotionValue(0); // -1 … 1 across the slot
  const hover = useMotionValue(0);
  const rotateY = useSpring(useTransform(x, [-1, 1], [-24, 24]), { stiffness: 160, damping: 14 });
  const lift = useSpring(useTransform(hover, [0, 1], [0, -10]), { stiffness: 220, damping: 15 });
  const wish = !amiibo.owned;
  const { width, height, baseX, baseWidth } = amiibo.fit;
  const vars = { '--w': width, '--h': height, '--bx': baseX, '--bw': baseWidth, '--gap': gap } as CSSProperties;

  return (
    <Slot
      style={vars}
      initial={reveal ? { opacity: 0, y: 30 } : { opacity: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: reveal ? Math.min(index, 12) * 0.06 : 0, ease: 'easeOut' }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width) * 2 - 1);
        hover.set(1);
      }}
      onPointerLeave={() => {
        x.set(0);
        hover.set(0);
      }}
    >
      <Stage $wish={wish}>
        {amiibo.image && (
          <Figure
            src={amiibo.image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{ rotateY, y: lift, transformOrigin: `${(baseX / width) * 100}% 100%` }}
          />
        )}
      </Stage>
      <Caption>
        <span className="name">{amiibo.name}</span>
        {amiibo.line && <span className="line">{amiibo.line}</span>}
        <span className="visually-hidden">{wish ? ` · ${t('games.totalWishlist')}` : ''}</span>
      </Caption>
    </Slot>
  );
}

/** Splits a series into runs: consecutive figures of the same group form one run, everything else stands alone. */
function runs(items: Amiibo[]): Amiibo[][] {
  const out: Amiibo[][] = [];
  for (const a of items) {
    const last = out.at(-1);
    if (a.group && last?.[0].group === a.group) last.push(a);
    else out.push([a]);
  }
  return out;
}

export function AmiiboShelves() {
  const { t } = useI18n();
  // The first render gets the staggered rise; nothing re-animates afterwards.
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);

  let index = 0;
  return (
    <Groups>
      {amiiboSeries.map((series) => {
        const owned = series.items.filter((a) => a.owned).length;
        const titleId = `amiibo-${series.id}`;
        const tallest = Math.max(...series.items.map((a) => a.fit.height));
        return (
          <Group key={series.id} aria-labelledby={titleId}>
            <SeriesCard>
              <PlatformMark id="amiibo" size={26} />
              <h3 id={titleId}>{series.name}</h3>
              <div className="stats">
                <b>{owned}</b> {t('amiibo.owned', { total: series.items.length })}
              </div>
            </SeriesCard>
            <Shelf style={{ '--tallest': tallest } as CSSProperties}>
              {runs(series.items).map((run) =>
                run.length === 1 ? (
                  <AmiiboFigure key={run[0].id} amiibo={run[0]} index={index++} reveal={firstRender.current} gap={GAP} />
                ) : (
                  <Bundle key={run[0].id} style={{ margin: `0 calc(var(--u) * ${(GAP - GROUP_GAP) / 2} * 1px)` }}>
                    <ul>
                      {run.map((a) => (
                        <AmiiboFigure key={a.id} amiibo={a} index={index++} reveal={firstRender.current} gap={GROUP_GAP} />
                      ))}
                    </ul>
                  </Bundle>
                ),
              )}
            </Shelf>
          </Group>
        );
      })}
    </Groups>
  );
}
