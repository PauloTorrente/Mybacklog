import styled from 'styled-components';
import { countByGenre, type Game } from '../../data/games';
import { useI18n } from '../../i18n/I18nProvider';

/** Aqua tints by rank, neutral for "others": no third accent colour. */
const TINTS = ['#4ECDC4', '#7DDCD5', '#A6E8E3', '#C9F1EE', '#E2F7F5'];
const MAX_NAMED = TINTS.length;

const Figure = styled.figure`
  margin: 0;
`;

const Title = styled.figcaption`
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
`;

const Track = styled.div`
  display: flex;
  height: 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  overflow: hidden;
  background: ${({ theme }) => theme.color.neutralSoft};
`;

const Segment = styled.span`
  display: block;
  height: 100%;
  transition: width 0.4s ease;
  & + & { border-left: 2px solid rgba(255, 255, 255, 0.9); }
`;

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin: 0.7rem 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.color.muted};

  li { display: inline-flex; align-items: center; gap: 0.4rem; }
  i { width: 10px; height: 10px; border-radius: 50%; border: 1px solid ${({ theme }) => theme.color.line}; }
  b { color: ${({ theme }) => theme.color.ink}; }
`;

export function GenreBar({ games }: { games: Game[] }) {
  const { t, genre } = useI18n();
  const ranked = countByGenre(games);
  const named = ranked.length > MAX_NAMED + 1 ? ranked.slice(0, MAX_NAMED) : ranked;
  const othersCount = ranked.slice(named.length).reduce((sum, [, n]) => sum + n, 0);
  const rows = [
    ...named.map(([g, n], i) => ({ key: g, label: genre(g), count: n, color: TINTS[i] ?? TINTS[TINTS.length - 1] })),
    ...(othersCount ? [{ key: '__others', label: t('games.others'), count: othersCount, color: '#CBD5E1' }] : []),
  ];
  const total = games.length || 1;

  return (
    <Figure aria-labelledby="genre-bar-title">
      <Title id="genre-bar-title">{t('games.distribution')}</Title>
      <Track aria-hidden="true">
        {rows.map((r) => (
          <Segment key={r.key} style={{ width: `${(r.count / total) * 100}%`, background: r.color }} />
        ))}
      </Track>
      <Legend>
        {rows.map((r) => (
          <li key={r.key}>
            <i style={{ background: r.color }} aria-hidden="true" />
            {r.label} <b>{r.count}</b>
          </li>
        ))}
      </Legend>
    </Figure>
  );
}
