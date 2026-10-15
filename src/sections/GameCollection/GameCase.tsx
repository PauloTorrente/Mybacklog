import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { caseSpecs, covers } from '../../data/covers';
import { platformById, type Game } from '../../data/games';
import { useI18n } from '../../i18n/I18nProvider';

/**
 * A game as a physical case standing on the shelf: front, spine, back and plastic edges in 3D.
 * Size comes from CSS vars set on the shelf: --h (height), --w (front width), --d (spine depth).
 */
const Slot = styled(motion.li)`
  list-style: none;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: var(--plank-offset);

`;

const CaseButton = styled.button<{ $wish: boolean }>`
  position: relative;
  width: var(--w);
  height: var(--h);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  perspective: 700px;
  perspective-origin: 50% 25%;
  /* Games not owned yet stand on the shelf "switched off": greyed out and faded. */
  opacity: ${({ $wish }) => ($wish ? 0.45 : 1)};
  filter: ${({ $wish }) => ($wish ? 'grayscale(1)' : 'none')};

  &:focus-visible { outline: none; }
  &:focus-visible .front { box-shadow: 0 0 0 3px ${({ theme }) => theme.color.aquaInk}, 0 0 0 7px ${({ theme }) => theme.color.aquaRing}; }

  /* Floor shadow */
  &::after {
    content: '';
    position: absolute;
    left: -6%;
    right: -2%;
    bottom: -6px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(30, 64, 120, 0.3), transparent);
    transition: transform 0.5s, opacity 0.5s;
    pointer-events: none;
  }
  &:hover::after, &:focus-visible::after { transform: scale(0.85); opacity: 0.6; }
`;

const Box = styled.span`
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(-6deg) rotateY(32deg);
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

  button:hover > &,
  button:focus-visible > & {
    transform: translateY(-12px) translateZ(24px) rotateX(-2deg) rotateY(0deg);
  }
  button[aria-pressed='true'] > &,
  button[aria-pressed='true']:hover > &,
  button[aria-pressed='true']:focus-visible > & {
    transform: translateY(-12px) translateZ(24px) rotateX(-2deg) rotateY(180deg);
  }
`;

const Face = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  backface-visibility: hidden;

  > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.front, &.back {
    width: var(--w);
    height: var(--h);
    border-radius: 3px;
  }
  &.front { transform: translateZ(calc(var(--d) / 2)); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
  &.back { transform: rotateY(180deg) translateZ(calc(var(--d) / 2)); }

  &.spine, &.edge {
    width: var(--d);
    height: var(--h);
    left: calc((var(--w) - var(--d)) / 2);
  }
  &.spine { transform: rotateY(-90deg) translateZ(calc(var(--w) / 2)); }
  &.edge { transform: rotateY(90deg) translateZ(calc(var(--w) / 2)); background: var(--plastic); filter: brightness(0.9); }

  &.top, &.bottom {
    width: var(--w);
    height: var(--d);
    top: calc((var(--h) - var(--d)) / 2);
    background: var(--plastic);
  }
  &.top { transform: rotateX(90deg) translateZ(calc(var(--h) / 2)); filter: brightness(1.08); }
  &.bottom { transform: rotateX(-90deg) translateZ(calc(var(--h) / 2)); filter: brightness(0.8); }
`;

/** Generic case for games without a scanned cover yet. */
const Blank = styled.span`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, #FFFFFF, #E6F0F8);

  .band {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 16%;
    background: var(--plastic);
    color: var(--plastic-ink);
    font-family: ${({ theme }) => theme.font.heading};
    font-weight: 700;
    font-size: calc(var(--h) * 0.06);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .title {
    flex: 1;
    display: grid;
    place-items: center;
    padding: 0.5rem;
    text-align: center;
    font-family: ${({ theme }) => theme.font.heading};
    font-weight: 700;
    font-size: calc(var(--h) * 0.075);
    line-height: 1.15;
    color: ${({ theme }) => theme.color.ink};
    overflow-wrap: anywhere;
  }
  .note {
    padding-bottom: 0.4rem;
    text-align: center;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: calc(var(--h) * 0.045);
    color: ${({ theme }) => theme.color.muted};
  }
`;

const BlankSpine = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #FFFFFF, #EEF4FA);
  border-top: calc(var(--h) * 0.16) solid var(--plastic);
  writing-mode: vertical-rl;
  font-family: ${({ theme }) => theme.font.heading};
  font-weight: 700;
  font-size: calc(var(--d) * 0.55);
  color: ${({ theme }) => theme.color.ink};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Stagger only the first 12 cases; the rest just rise in as they scroll into view. */
const STAGGER_LIMIT = 12;

interface Props {
  game: Game;
  index: number;
  /** First reveal rises 40px with stagger; cases added later by a filter change just fade in. */
  reveal: boolean;
}

export const GameCase = forwardRef<HTMLLIElement, Props>(function GameCase({ game, index, reveal }, ref) {
  const { t, genre } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const cover = covers.get(game.id);
  const wish = game.status === 'wishlist';
  const delay = reveal && index < STAGGER_LIMIT ? index * 0.1 : 0;
  const { plastic, plasticInk } = caseSpecs[game.platformId];
  const platform = platformById.get(game.platformId);

  return (
    <Slot
      ref={ref}
      layout="position"
      initial={reveal ? { opacity: 0, y: 40 } : { opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: reveal ? 0.5 : 0.25, delay, ease: 'easeOut' }}
    >
      <CaseButton
        type="button"
        $wish={wish}
        aria-pressed={flipped}
        title={`${game.title} — ${t('games.flipHint')}`}
        onClick={() => setFlipped((f) => !f)}
        style={{ ['--plastic' as string]: plastic, ['--plastic-ink' as string]: plasticInk }}
      >
        <span className="visually-hidden">
          {game.title} · {genre(game.genre)}
          {wish ? ` · ${t('games.totalWishlist')}` : ''}
        </span>
        <Box aria-hidden="true">
          <Face className="front">
            {cover ? (
              <img src={cover.front} alt="" loading="lazy" decoding="async" />
            ) : (
              <Blank>
                <span className="band">{platform?.short}</span>
                <span className="title">{game.title}</span>
                <span className="note">{t('games.noCover')}</span>
              </Blank>
            )}
          </Face>
          <Face className="spine">
            {cover?.spine ? <img src={cover.spine} alt="" loading="lazy" decoding="async" /> : <BlankSpine>{game.title}</BlankSpine>}
          </Face>
          <Face className="back">
            {cover?.back ? (
              <img src={cover.back} alt="" loading="lazy" decoding="async" />
            ) : (
              <Blank>
                <span className="band" />
                <span className="title">{platform?.name}</span>
              </Blank>
            )}
          </Face>
          <Face className="edge" />
          <Face className="top" />
          <Face className="bottom" />
        </Box>
      </CaseButton>
    </Slot>
  );
});
