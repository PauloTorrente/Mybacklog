import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import pixSymbol from '../../assets/logos/pix-symbol.png';

/** Random Pix key (chave aleatória). */
const PIX_KEY = '27a0b512-e47b-4549-8810-95048d3eacb4';
const PIX = '#32BCAD';
const PIX_INK = '#0E7C72';

const Wrap = styled.div`
  position: relative;
  justify-self: end;
  align-self: start;
`;

/** Quiet by default: a small invitation; the key only shows when asked for. */
const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem 0.5rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(50, 188, 173, 0.45);
  background: rgba(255, 255, 255, 0.8);
  color: ${({ theme }) => theme.color.ink};
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  img { width: 26px; height: auto; }
  b { color: ${PIX_INK}; }
  &:hover, &[aria-expanded='true'] { border-color: ${PIX}; box-shadow: 0 8px 20px rgba(50, 188, 173, 0.2); transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid ${PIX_INK}; outline-offset: 2px; }
`;

const Pop = styled(motion.div)`
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 40;
  width: min(330px, calc(100vw - 32px));
  padding: 1.1rem 1.15rem 1.2rem;
  border-radius: 1.2rem;
  background: linear-gradient(160deg, #ffffff, #effbf9);
  border: 1px solid #fff;
  box-shadow: 0 18px 40px rgba(30, 64, 120, 0.18);
  transform-origin: top right;

  .head { display: flex; align-items: center; gap: 0.7rem; }
  .head img { width: 40px; }
  strong { font-family: ${({ theme }) => theme.font.heading}; font-size: 1.05rem; line-height: 1.3; }
  p { margin: 0.6rem 0 0; font-size: 0.85rem; line-height: 1.5; color: ${({ theme }) => theme.color.muted}; }
  .label { margin-top: 0.85rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${PIX_INK}; }
  code {
    display: block;
    margin-top: 0.3rem;
    padding: 0.55rem 0.65rem;
    border-radius: 0.6rem;
    background: #fff;
    border: 1px dashed ${PIX};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.75rem;
    overflow-wrap: anywhere;
    user-select: all;
  }
  button {
    margin-top: 0.8rem;
    width: 100%;
    min-height: 40px;
    border-radius: 999px;
    border: 0;
    background: ${PIX_INK};
    color: #fff;
    font-weight: 700;
    cursor: pointer;
  }
  button:focus-visible { outline: 2px solid ${PIX}; outline-offset: 2px; }
`;

export function PixCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copie a chave Pix:', PIX_KEY);
    }
  };

  return (
    <Wrap ref={wrap}>
      <Trigger type="button" aria-expanded={open} aria-controls="pix-pop" onClick={() => setOpen((o) => !o)}>
        <img src={pixSymbol} alt="" />
        <span>
          Quer ajudar a coleção? <b>Apoie com Pix</b>
        </span>
      </Trigger>
      <AnimatePresence>
        {open && (
          <Pop
            id="pix-pop"
            role="dialog"
            aria-label="Apoiar com Pix"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="head">
              <img src={pixSymbol} alt="Pix" />
              <strong>Ajude a realizar meu sonho</strong>
            </div>
            <p>
              Esta coleção é um sonho de infância. Se quiser dar uma força para trazer o próximo jogo para a estante, qualquer valor
              é muito bem-vindo. Obrigado!
            </p>
            <div className="label">Chave Pix aleatória</div>
            <code>{PIX_KEY}</code>
            <button type="button" onClick={copy} aria-live="polite">
              {copied ? 'Chave copiada' : 'Copiar chave Pix'}
            </button>
          </Pop>
        )}
      </AnimatePresence>
    </Wrap>
  );
}
