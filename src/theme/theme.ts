/** Aero Console tokens (Frutiger Aero + Wii menu + Nintendo DS). */
export const theme = {
  color: {
    bgTop: '#E0F0FF',
    bgBottom: '#FFFFFF',
    ink: '#1E293B',
    muted: '#5B6B80',
    aqua: '#4ECDC4',
    // Aqua/coral darkened to the same hue only where they are used as text, for AA contrast.
    aquaInk: '#13766F',
    aquaSoft: 'rgba(78, 205, 196, 0.14)',
    aquaRing: 'rgba(78, 205, 196, 0.22)',
    coral: '#FF6B6B',
    coralInk: '#D64545',
    neutral: '#CBD5E1',
    neutralSoft: 'rgba(148, 163, 184, 0.12)',
    line: 'rgba(148, 163, 184, 0.28)',
  },
  glass: {
    fill: 'rgba(255, 255, 255, 0.7)',
    fillOpaque: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid #FFFFFF',
    blur: 'blur(12px)',
    shadow: '0 8px 32px rgba(30, 64, 120, 0.08)',
  },
  radius: { card: '1.5rem', pill: '999px' },
  font: {
    heading: "'Quicksand', system-ui, sans-serif",
    body: "'Nunito', system-ui, sans-serif",
    mono: "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, Consolas, monospace",
  },
  bp: { sm: '480px', md: '900px', mobile: '768px' },
} as const;

export type AeroTheme = typeof theme;
