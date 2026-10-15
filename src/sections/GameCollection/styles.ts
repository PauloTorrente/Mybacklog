import styled, { css } from 'styled-components';

export const glass = css`
  background: ${({ theme }) => theme.glass.fill};
  backdrop-filter: ${({ theme }) => theme.glass.blur};
  -webkit-backdrop-filter: ${({ theme }) => theme.glass.blur};
  border: ${({ theme }) => theme.glass.border};
  border-radius: ${({ theme }) => theme.radius.card};
  box-shadow: ${({ theme }) => theme.glass.shadow};

  @media (max-width: ${({ theme }) => theme.bp.mobile}) {
    background: ${({ theme }) => theme.glass.fillOpaque};
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
`;

export const Section = styled.section`
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(2rem, 6vw, 4.5rem) 16px 4rem;
  display: grid;
  gap: 1.5rem;
`;

export const Header = styled.header`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 6vw, 3.25rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
`;

export const Dream = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.heading};
  font-size: 1.25rem;
  font-weight: 700;
  font-style: italic;
  color: ${({ theme }) => theme.color.coralInk};
`;

export const Total = styled.p`
  margin: 0.25rem 0 0;
  color: ${({ theme }) => theme.color.muted};

  strong {
    font-family: ${({ theme }) => theme.font.heading};
    font-size: 1.75rem;
    color: ${({ theme }) => theme.color.ink};
    margin-right: 0.4rem;
  }
  strong.small { font-size: 1.25rem; }
  .sep { margin: 0 0.6rem; }
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.aquaInk};
  margin-bottom: 0.6rem;
`;

export const Panel = styled.div`
  ${glass};
  padding: 1.25rem;
`;

export const ResultsLine = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.muted};
  font-weight: 600;
  min-height: 1.5em;
  scroll-margin-top: 1rem;
`;

export const ClearButton = styled.button`
  border: 1px solid ${({ theme }) => theme.color.aqua};
  background: ${({ theme }) => theme.color.aquaSoft};
  color: ${({ theme }) => theme.color.aquaInk};
  font-weight: 700;
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 0.6rem 1.25rem;
  min-height: 44px;
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;

  &:hover { background: rgba(78, 205, 196, 0.24); }
  &:focus-visible { outline: none; box-shadow: 0 0 0 3px ${({ theme }) => theme.color.aquaRing}; border-color: ${({ theme }) => theme.color.aquaInk}; }
`;
