import { MotionConfig } from 'framer-motion';
import styled from 'styled-components';
import { useI18n } from './i18n/I18nProvider';
import type { Lang } from './i18n/messages';
import GameCollection from './sections/GameCollection';
import { Orbs } from './theme/Orbs';

const LANGS: Lang[] = ['pt', 'es', 'en'];

const Bar = styled.nav`
  display: flex;
  justify-content: flex-end;
  gap: 0.35rem;
  max-width: 1120px;
  margin: 0 auto;
  padding: 1rem 16px 0;

  button {
    min-width: 44px;
    min-height: 36px;
    border-radius: ${({ theme }) => theme.radius.pill};
    border: 1px solid ${({ theme }) => theme.color.line};
    background: rgba(255, 255, 255, 0.75);
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.8rem;
    text-transform: uppercase;
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.color.aqua};
    background: ${({ theme }) => theme.color.aquaSoft};
    color: ${({ theme }) => theme.color.aquaInk};
    font-weight: 700;
  }
`;

export default function App() {
  const { lang, setLang, t } = useI18n();
  return (
    <MotionConfig reducedMotion="user">
      <Orbs />
      <Bar aria-label={t('lang.label')}>
        {LANGS.map((l) => (
          <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)}>
            {l}
          </button>
        ))}
      </Bar>
      <main>
        <GameCollection />
      </main>
    </MotionConfig>
  );
}
