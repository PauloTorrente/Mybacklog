import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import App from './App';
import { I18nProvider } from './i18n/I18nProvider';
import { CatalogProvider } from './data/catalog';
import { InfoMenuProvider } from './sections/GameCollection/InfoMenu';
import { GlobalStyle } from './theme/GlobalStyle';
import { theme } from './theme/theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <I18nProvider>
        <CatalogProvider>
          <InfoMenuProvider>
            <App />
          </InfoMenuProvider>
        </CatalogProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
