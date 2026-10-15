import { motion } from 'framer-motion';
import styled from 'styled-components';
import { platforms, type ShelfId } from '../../data/games';
import { useI18n } from '../../i18n/I18nProvider';
import { platformCubes } from '../../data/platformLogos';
import { PlatformMark } from './PlatformMark';
import { glass } from './styles';
import { useRadioKeys } from './useRadioKeys';

/**
 * Entrance: the cubes slide in from the left like hangers pushed along a wardrobe rail,
 * swing on their hook when they stop, and settle facing the viewer.
 */
const SLIDE_FROM = -1100;
const SLIDE_S = 1.1;
const STAGGER_S = 0.09;
/** Swing on stopping (degrees around the hook above the cube): trails while moving, overshoots, settles. */
const SWING = [6, 6, -9, 5, -2.5, 1, 0];

const Tray = styled.div`
  ${glass};
  display: grid;
  justify-items: center;
  gap: 1.25rem;
  padding: 2.25rem 1rem 1.25rem;
  overflow: hidden;
`;

const Table = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2.5rem 3.5rem;
  perspective: 900px;

  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    gap: 2rem 1.75rem;
  }
`;

const DieButton = styled.button`
  --s: 104px;
  position: relative;
  width: var(--s);
  height: calc(var(--s) + 22px);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  perspective: 600px;
  border-radius: 1rem;

  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    --s: 80px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.aquaInk};
    outline-offset: 10px;
  }
`;

const Shadow = styled(motion.span)`
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 0;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(30, 64, 120, 0.28), transparent);
`;

const Cube = styled(motion.div)`
  position: absolute;
  inset: 0 0 auto 0;
  height: var(--s);
  transform-style: preserve-3d;
`;

const Face = styled.span<{ $active: boolean; $from: string; $to: string; $logo: 'fill' | 'white' | 'plain' }>`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.3rem;
  /* Small radius so the faces meet at the edges and the cube looks closed. */
  border-radius: 8%;
  overflow: hidden;
  border: ${({ $active, theme }) => ($active ? `2px solid ${theme.color.aqua}` : '1px solid rgba(255, 255, 255, 0.7)')};
  /* Colour runs left → right across every face. */
  background: linear-gradient(90deg, ${({ $from }) => $from} 0%, ${({ $to }) => $to} 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  backface-visibility: hidden;

  &.front  { transform: translateZ(calc(var(--s) / 2)); }
  &.back   { transform: rotateY(180deg) translateZ(calc(var(--s) / 2)); }
  &.right  { transform: rotateY(90deg) translateZ(calc(var(--s) / 2)); }
  &.left   { transform: rotateY(-90deg) translateZ(calc(var(--s) / 2)); }
  &.top    { transform: rotateX(90deg) translateZ(calc(var(--s) / 2)); }
  /* Side faces a touch darker, top a touch lighter, so the block reads as solid. */
  &.right, &.left { filter: brightness(0.93); }
  &.top { filter: brightness(1.04); }
  &.bottom { transform: rotateX(-90deg) translateZ(calc(var(--s) / 2)); }

  &.front { box-shadow: ${({ $active, theme }) => ($active ? `0 0 0 3px ${theme.color.aquaRing}` : 'inset 0 0 0 1px rgba(148,163,184,.18)')}; }

  img {
    max-width: calc(var(--s) * 0.72);
    max-height: calc(var(--s) * 0.4);
    height: auto;
  }
  ${({ $logo }) =>
    $logo === 'fill'
      ? `> span, > span img { width: 100%; height: 100%; max-width: none; max-height: none; min-width: 0; border-radius: 0; }`
      : $logo === 'white'
        ? `img { filter: brightness(0) invert(1); }`
        : ''}

`;

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.muted};
  font-weight: 600;
  text-align: center;
`;

interface Props {
  value: ShelfId | null;
  counts: Map<ShelfId, number>;
  onChange: (value: ShelfId) => void;
}

/** The consoles, then the amiibo cube at the end of the row. */
const cubes: { id: ShelfId; name: string }[] = [...platforms.map((p) => ({ id: p.id, name: p.name })), { id: 'amiibo', name: 'amiibo' }];

export function PlatformCubes({ value, counts, onChange }: Props) {
  const { t, plural } = useI18n();
  const ids = cubes.map((c) => c.id);
  // Arrow keys move between cubes; with nothing picked yet, start from the first one.
  const { onKeyDown, register } = useRadioKeys(ids, value ?? ids[0], onChange);

  return (
    <Tray>
      <Table role="radiogroup" aria-label={t('games.cubes')} onKeyDown={onKeyDown}>
        {cubes.map((p, i) => {
          const active = p.id === value;
          const count = counts.get(p.id) ?? 0;
          const look = platformCubes[p.id];
          // The rightmost hanger leads, the others follow close behind it.
          const delay = (cubes.length - 1 - i) * STAGGER_S;
          return (
            <DieButton
              key={p.id}
              ref={register(i)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${p.name}, ${plural(p.id === 'amiibo' ? 'amiibo.count' : 'games.count', count)}`}
              tabIndex={active || (value === null && i === 0) ? 0 : -1}
              onClick={() => onChange(p.id)}
            >
              <Shadow
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: active ? 0.7 : 1, scale: active ? 0.8 : 1 }}
                transition={{ delay: delay + SLIDE_S * 0.7, duration: 0.4 }}
              />
              <Cube
                aria-hidden="true"
                style={{ originY: '-30%' }}
                initial={{ x: SLIDE_FROM, rotateZ: SWING[0] }}
                animate={{ x: 0, y: active ? -14 : 0, rotateZ: SWING, rotateY: 0 }}
                whileHover={{ y: -8, rotateY: 14 }}
                whileTap={{ scale: 0.94 }}
                transition={{
                  x: { duration: SLIDE_S, delay, ease: [0.22, 1, 0.36, 1] },
                  rotateZ: { duration: SLIDE_S + 1, delay, times: [0, 0.4, 0.55, 0.7, 0.82, 0.92, 1], ease: 'easeInOut' },
                  y: { type: 'spring', stiffness: 140, damping: 9 },
                  rotateY: { type: 'spring', stiffness: 120, damping: 14 },
                }}
              >
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="front"><PlatformMark id={p.id} size={40} stacked /></Face>
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="back"><PlatformMark id={p.id} size={40} stacked /></Face>
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="right"><PlatformMark id={p.id} size={40} stacked /></Face>
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="left"><PlatformMark id={p.id} size={40} stacked /></Face>
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="top"><PlatformMark id={p.id} size={40} stacked /></Face>
                <Face $active={active} $from={look.from} $to={look.to} $logo={look.logo} className="bottom"><PlatformMark id={p.id} size={40} stacked /></Face>
              </Cube>
            </DieButton>
          );
        })}
      </Table>
      {value === null && <Hint>{t('games.pick')}</Hint>}
    </Tray>
  );
}
