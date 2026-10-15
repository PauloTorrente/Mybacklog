import styled from 'styled-components';
import type { ShelfId } from '../../data/games';
import { platformById } from '../../data/games';
import { platformLogos, platformStackedLogos } from '../../data/platformLogos';

const Box = styled.span<{ $size: number }>`
  display: inline-grid;
  place-items: center;
  height: ${({ $size }) => $size}px;
  min-width: ${({ $size }) => $size}px;
  flex: none;

  img {
    display: block;
    height: ${({ $size }) => $size}px;
    width: auto;
    max-width: ${({ $size }) => $size * 3.2}px;
    object-fit: contain;
    border-radius: ${({ $size }) => Math.round($size * 0.22)}px;
  }

  .text {
    display: inline-grid;
    place-items: center;
    height: 100%;
    padding: 0 ${({ $size }) => Math.round($size * 0.25)}px;
    border-radius: ${({ $size }) => Math.round($size * 0.3)}px;
    border: 1.5px solid ${({ theme }) => theme.color.line};
    background: rgba(255, 255, 255, 0.9);
    font-family: ${({ theme }) => theme.font.heading};
    font-weight: 700;
    font-size: ${({ $size }) => Math.round($size * 0.42)}px;
    color: ${({ theme }) => theme.color.ink};
    letter-spacing: 0.02em;
  }
`;

/** Console logo (decorative: the name is always rendered as text next to it). */
export function PlatformMark({ id, size = 32, stacked = false }: { id: ShelfId; size?: number; stacked?: boolean }) {
  const logo = (stacked && platformStackedLogos[id]) || platformLogos[id];
  return (
    <Box $size={size} aria-hidden="true">
      {logo ? <img src={logo} alt="" loading="lazy" decoding="async" /> : <span className="text">{(id === 'amiibo' ? 'amiibo' : platformById.get(id)?.short)}</span>}
    </Box>
  );
}
