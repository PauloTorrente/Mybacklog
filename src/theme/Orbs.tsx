import styled from 'styled-components';

/** Blurred background orbs, fixed to the corners. Purely decorative. */
const Orb = styled.div<{ $corner: 'tl' | 'br' }>`
  position: fixed;
  z-index: -1;
  pointer-events: none;
  width: min(60vw, 520px);
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  ${({ $corner, theme }) =>
    $corner === 'tl'
      ? `top: -18%; left: -14%; background: ${theme.color.aqua};`
      : `bottom: -22%; right: -16%; background: ${theme.color.coral}; opacity: 0.18;`}
`;

export function Orbs() {
  return (
    <>
      <Orb $corner="tl" aria-hidden="true" />
      <Orb $corner="br" aria-hidden="true" />
    </>
  );
}
