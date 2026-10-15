import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html {
    scrollbar-gutter: stable;
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: ${({ theme }) => theme.font.body};
    color: ${({ theme }) => theme.color.ink};
    background: linear-gradient(180deg, ${({ theme }) => theme.color.bgTop} 0%, ${({ theme }) => theme.color.bgBottom} 70%) fixed;
    overflow-x: hidden;
  }

  h1, h2, h3 { font-family: ${({ theme }) => theme.font.heading}; margin: 0; }

  button, input { font: inherit; color: inherit; }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.aquaInk};
    outline-offset: 2px;
  }

  .visually-hidden {
    position: absolute !important;
    width: 1px; height: 1px;
    margin: -1px; padding: 0; border: 0;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;
