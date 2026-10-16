import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { useI18n } from '../../i18n/I18nProvider';
import { amiibos } from '../../data/amiibo';
import { AmiiboShelves } from './AmiiboShelves';
import { ProgressButton, ProgressPanel } from './ProgressPanel';
import { PixCard } from './PixCard';
import { DetailsTip } from './DetailsTip';
import { GameGrid } from './GameGrid';
import { GenreBar } from './GenreBar';
import { GenreFilter } from './GenreFilter';
import { PlatformCubes } from './PlatformCubes';
import { ClearButton, Dream, Header, Panel, ResultsLine, Section, Title, Total } from './styles';
import { useGameFilters } from './useGameFilters';

const Empty = styled(Panel)`
  display: grid;
  justify-items: center;
  gap: 1rem;
  padding: 2.5rem 1.25rem;
  text-align: center;

  p { margin: 0; font-family: ${({ theme }) => theme.font.heading}; font-size: 1.2rem; font-weight: 700; }
`;

const Tools = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
  max-width: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const Toggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0.45rem 1rem;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.color.line};
  background: rgba(255, 255, 255, 0.8);
  color: ${({ theme }) => theme.color.ink};
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover { border-color: ${({ theme }) => theme.color.aqua}; }
  &[aria-expanded='true'] { border-color: ${({ theme }) => theme.color.aqua}; background: ${({ theme }) => theme.color.aquaSoft}; }
  &:focus-visible { outline: none; box-shadow: 0 0 0 3px ${({ theme }) => theme.color.aquaRing}; border-color: ${({ theme }) => theme.color.aquaInk}; }

  .chev { transition: transform 0.25s; font-size: 0.75rem; }
  &[aria-expanded='true'] .chev { transform: rotate(180deg); }
  .badge {
    min-width: 1.4rem;
    padding: 0 0.4rem;
    border-radius: ${({ theme }) => theme.radius.pill};
    background: ${({ theme }) => theme.color.aquaInk};
    color: #fff;
    font-size: 0.75rem;
    line-height: 1.4rem;
    text-align: center;
  }
`;

const TextButton = styled.button`
  border: 0;
  background: none;
  padding: 0.4rem 0.5rem;
  color: ${({ theme }) => theme.color.aquaInk};
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 6px;
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aquaInk}; outline-offset: 2px; }
`;

/** Clipped only while it slides open or shut, so the glass shadow isn't cut off once it's open. */
const GenrePanel = styled(motion.div)``;

const GenrePanelInner = styled.div`
  display: grid;
  gap: 1.1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.color.line};
`;

const Results = styled(motion.div)`
  display: grid;
  gap: 1.5rem;
  /* Keeps the page from collapsing (and the footer from jumping) when results shrink. */
  min-height: 60vh;
  align-content: start;
`;

export default function GameCollection() {
  const { t, plural } = useI18n();
  const f = useGameFilters();
  const platform = f.filters.platform;
  const selectedGenres = f.filters.genres.length;
  // Genre tools stay folded away unless a genre filter is already active (e.g. from a shared link).
  const [genresOpen, setGenresOpen] = useState(selectedGenres > 0);
  const [progressOpen, setProgressOpen] = useState(false);

  // After a pick, bring the list into view if it opened below the fold (mostly on phones).
  const statusRef = useRef<HTMLParagraphElement>(null);
  const firstPick = useRef(true);
  useEffect(() => {
    if (firstPick.current) {
      firstPick.current = false; // don't jump on load when the URL already has ?console=
      return;
    }
    const el = statusRef.current;
    if (!platform || !el || el.getBoundingClientRect().top < window.innerHeight * 0.8) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [platform]);

  return (
    <Section id="colecao" aria-labelledby="colecao-title">
      <Header>
        <div className="intro">
        <Title id="colecao-title">{t('games.title')}</Title>
        <Dream>“{t('games.dream')}”</Dream>
        <Total>
          <strong>{f.ownedCount}</strong>
          {t('games.total')}
          <span className="sep" aria-hidden="true">·</span>
          <strong className="small">{f.wishlistCount}</strong>
          {t('games.totalWishlist')}
        </Total>
        <HeaderActions>
          <ProgressButton onOpen={() => setProgressOpen(true)} />
        </HeaderActions>
        </div>
        <PixCard />
      </Header>

      <AnimatePresence>{progressOpen && <ProgressPanel key="progress" onClose={() => setProgressOpen(false)} />}</AnimatePresence>
      <DetailsTip show={platform !== null} />

      <PlatformCubes value={platform} counts={f.platformCounts} onChange={f.setPlatform} />

      {/* Announces the result count to screen readers; the console card shows it on screen. */}
      <ResultsLine ref={statusRef} role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {platform === 'amiibo' ? plural('amiibo.count', amiibos.length) : platform ? plural('games.count', f.results.length) : ''}
      </ResultsLine>

      <AnimatePresence mode="wait">
        {platform && (
          <Results
            key={platform === 'amiibo' ? 'amiibo' : 'results'}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >

            {platform === 'amiibo' ? (
              <AmiiboShelves />
            ) : f.results.length > 0 ? (
              // Keyed by console so each pick gets the full staggered entrance.
              <GameGrid
                key={platform}
                games={f.results}
                tools={
                  <Tools>
                    {selectedGenres > 0 && !genresOpen && (
                      <TextButton type="button" onClick={f.clear}>{t('games.clear')}</TextButton>
                    )}
                    <Toggle type="button" aria-expanded={genresOpen} aria-controls="genre-panel" onClick={() => setGenresOpen((o) => !o)}>
                      {t('games.filterGenre')}
                      {selectedGenres > 0 && <span className="badge">{selectedGenres}</span>}
                      <span className="chev" aria-hidden="true">▾</span>
                    </Toggle>
                  </Tools>
                }
                panel={
                  <AnimatePresence initial={false}>
                    {genresOpen && (
                      <GenrePanel
                        id="genre-panel"
                        key="genres"
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        <GenrePanelInner>
                          <GenreFilter options={f.genreOptions} selected={f.filters.genres} onToggle={f.toggleGenre} />
                          <GenreBar games={f.results} />
                        </GenrePanelInner>
                      </GenrePanel>
                    )}
                  </AnimatePresence>
                }
              />
            ) : (
              <Empty>
                <p>{t('games.empty')}</p>
                <ClearButton type="button" onClick={f.clear}>{t('games.clear')}</ClearButton>
              </Empty>
            )}
          </Results>
        )}
      </AnimatePresence>
    </Section>
  );
}
