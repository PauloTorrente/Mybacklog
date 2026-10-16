import styled from 'styled-components';

type Corner = 'tl' | 'tr' | 'r' | 'br';

/** Blurred background orbs: aqua top-left, sky blue top-right, a soft aqua glow down the right side, coral bottom-right. */
const Orb = styled.div<{ $corner: Corner }>`
  position: fixed;
  z-index: -1;
  pointer-events: none;
  width: min(60vw, 520px);
  aspect-ratio: 1;
  border-radius: 50%;
  opacity: 0.55;
  /* Soft edges come from the gradient itself (no blur filter). */
  background: radial-gradient(closest-side, var(--c), transparent);
  ${({ $corner, theme }) =>
    ({
      tl: `top: -18%; left: -14%; --c: ${theme.color.aqua};`,
      tr: `top: -22%; right: -12%; --c: #7FB8FF; opacity: 0.5;`,
      r: `top: 38%; right: -24%; width: min(46vw, 420px); --c: ${theme.color.aqua}; opacity: 0.28;`,
      br: `bottom: -22%; right: -16%; --c: ${theme.color.coral}; opacity: 0.18;`,
    })[$corner]}
`;

export function Orbs() {
  return (
    <>
      <Orb $corner="tl" aria-hidden="true" />
      <Orb $corner="tr" aria-hidden="true" />
      <Orb $corner="r" aria-hidden="true" />
      <Orb $corner="br" aria-hidden="true" />
    </>
  );
}
