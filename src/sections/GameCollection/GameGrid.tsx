import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { caseSpecs } from '../../data/covers';
import { countByGenre, platforms, type Game } from '../../data/games';
import { useI18n } from '../../i18n/I18nProvider';
import { GameCase } from './GameCase';
import { PlatformMark } from './PlatformMark';
import { glass } from './styles';

const Groups = styled.div`
  display: grid;
  gap: 2.25rem;
`;

const Group = styled(motion.section)`
  display: grid;
  gap: 0.9rem;
`;

/** The console's card: logo, name and count on one row; tools on the right; an optional panel unfolds below. */
const GroupCard = styled.div`
  ${glass};
  padding: 1rem 1.25rem;
`;

const GroupHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;

  .text { flex: 1; min-width: 0; }
  .released {
    display: block;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.color.aquaInk};
  }
  h3 { font-size: clamp(1.25rem, 3vw, 1.6rem); font-weight: 700; }

  .stats {
    text-align: right;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.color.muted};
  }
  .stats b { color: ${({ theme }) => theme.color.ink}; font-size: 1.1rem; }

  /* Phones: logo + name on the first line, count and tools on the second. */
  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    flex-wrap: wrap;
    gap: 0.6rem 0.75rem;
    .text { flex: 1 1 10rem; }
    .stats { flex: 1 1 auto; text-align: left; }
  }
`;

/**
 * Glass shelves: every row is one plank. Rows have a fixed height (case + room for the wish tag),
 * so the planks are painted as a repeating background and always span the full width.
 */
const Shelf = styled.ul`
  --base: 200px;
  --h: calc(var(--base) * var(--scale));
  --w: calc(var(--h) * var(--aspect));
  --d: calc(var(--h) * var(--depth));
  --plank-offset: 34px;
  --row: calc(var(--h) + 30px + var(--plank-offset));

  @media (max-width: ${({ theme }) => theme.bp.sm}) {
    --base: 148px;
  }

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--w) + 34px), 1fr));
  grid-auto-rows: var(--row);
  margin: 0;
  padding: 0 0.5rem;
  background-image: linear-gradient(
    to bottom,
    transparent calc(var(--row) - var(--plank-offset)),
    rgba(255, 255, 255, 0.95) calc(var(--row) - var(--plank-offset)),
    rgba(240, 248, 255, 0.95) calc(var(--row) - var(--plank-offset) + 8px),
    rgba(190, 210, 230, 0.9) calc(var(--row) - var(--plank-offset) + 8px),
    rgba(190, 210, 230, 0.9) calc(var(--row) - var(--plank-offset) + 13px),
    rgba(30, 64, 120, 0.1) calc(var(--row) - var(--plank-offset) + 13px),
    transparent calc(var(--row) - var(--plank-offset) + 20px)
  );
  background-size: 100% var(--row);
  border-radius: 0.75rem;
`;

interface Props {
  games: Game[];
  /** Controls shown at the right edge of the console's card (the genre filter toggle). */
  tools?: ReactNode;
  /** Content that unfolds inside the card, under the header row (the genre filter). */
  panel?: ReactNode;
}

export function GameGrid({ games, tools, panel }: Props) {
  const { t, plural, genre } = useI18n();
  // Cards mounted on the first render get the full staggered entrance; later ones don't
  // re-run it, so changing a filter never re-animates the whole page.
  const firstRender = useRef(true);
  useEffect(() => {
    firstRender.current = false;
  }, []);

  const groups = useMemo(
    () =>
      platforms
        .map((p) => ({ platform: p, games: games.filter((g) => g.platformId === p.id) }))
        .filter((g) => g.games.length > 0),
    [games],
  );

  let index = 0; // global, so the 12-card stagger cap spans groups
  return (
    <Groups>
      <AnimatePresence mode="popLayout" initial={false}>
        {groups.map(({ platform, games: list }) => {
          const [top] = countByGenre(list);
          const titleId = `group-${platform.id}`;
          return (
            <Group
              key={platform.id}
              layout="position"
              aria-labelledby={titleId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <GroupCard>
                <GroupHeader>
                  <PlatformMark id={platform.id} size={44} />
                  <div className="text">
                    <span className="released">{t('games.released', { year: platform.year })}</span>
                    <h3 id={titleId}>{platform.name}</h3>
                  </div>
                  <div className="stats">
                    <b>{plural('games.count', list.length)}</b>
                    {top && <div>{t('games.topGenre', { genre: genre(top[0]), count: top[1] })}</div>}
                  </div>
                  {tools}
                </GroupHeader>
                {panel}
              </GroupCard>
              <Shelf
                style={{
                  ['--aspect' as string]: caseSpecs[platform.id].aspect,
                  ['--depth' as string]: caseSpecs[platform.id].depth,
                  ['--scale' as string]: caseSpecs[platform.id].scale,
                }}
              >
                <AnimatePresence mode="popLayout" initial={true}>
                  {list.map((game) => (
                    <GameCase key={game.id} game={game} index={index++} reveal={firstRender.current} />
                  ))}
                </AnimatePresence>
              </Shelf>
            </Group>
          );
        })}
      </AnimatePresence>
    </Groups>
  );
}
