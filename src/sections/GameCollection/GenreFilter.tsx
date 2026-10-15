import styled from 'styled-components';
import { useI18n } from '../../i18n/I18nProvider';
import { Label } from './styles';

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Pill = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 36px;
  padding: 0.35rem 0.9rem;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ $on, theme }) => ($on ? theme.color.aqua : theme.color.line)};
  background: ${({ $on, theme }) => ($on ? theme.color.aquaSoft : 'rgba(255,255,255,.75)')};
  color: ${({ $on, theme }) => ($on ? theme.color.aquaInk : theme.color.ink)};
  font-size: 0.9rem;
  font-weight: ${({ $on }) => ($on ? 700 : 600)};
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;

  &:hover { border-color: ${({ theme }) => theme.color.aqua}; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.aquaInk};
    outline-offset: 2px;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.aquaRing};
  }

  .n {
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.75rem;
    color: ${({ $on, theme }) => ($on ? theme.color.aquaInk : theme.color.muted)};
  }
`;

interface Props {
  options: [genre: string, count: number][];
  selected: string[];
  onToggle: (genre: string) => void;
}

export function GenreFilter({ options, selected, onToggle }: Props) {
  const { t, genre: genreLabel } = useI18n();
  return (
    <div role="group" aria-labelledby="genres-label">
      <Label id="genres-label">{t('games.genres')}</Label>
      <Pills>
        {options.map(([genre, count]) => {
          const on = selected.includes(genre);
          return (
            <Pill key={genre} type="button" aria-pressed={on} $on={on} onClick={() => onToggle(genre)}>
              {genreLabel(genre)}
              <span className="n" aria-hidden="true">{count}</span>
              <span className="visually-hidden">({count})</span>
            </Pill>
          );
        })}
      </Pills>
    </div>
  );
}
