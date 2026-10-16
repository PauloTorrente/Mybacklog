import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { InfoIcon } from './InfoMenu';

const KEY = 'dica-detalhes-vista';

const Toast = styled(motion.div)`
  position: fixed;
  left: 50%;
  bottom: 18px;
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: max-content;
  max-width: calc(100vw - 32px);
  padding: 0.75rem 0.8rem 0.75rem 1rem;
  border-radius: 1rem;
  background: #10324f;
  color: #fff;
  box-shadow: 0 16px 36px rgba(15, 30, 55, 0.35);
  font-size: 0.9rem;
  line-height: 1.4;

  .icon { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #13766f; }
  .icon svg { width: 18px; height: 18px; }
  b { color: #7ff0e6; }
  button {
    flex: none;
    min-height: 36px;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    border: 0;
    background: #fff;
    color: #10324f;
    font-weight: 700;
    cursor: pointer;
  }
  button:focus-visible { outline: 2px solid #7ff0e6; outline-offset: 2px; }
`;

/** Shown once, the first time a shelf opens: tells you the details exist and how to get to them. */
export function DetailsTip({ show }: { show: boolean }) {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || seen) return;
    const t = window.setTimeout(() => setVisible(true), 1500); // after the shelf has risen in
    return () => window.clearTimeout(t);
  }, [show, seen]);

  const dismiss = () => {
    setVisible(false);
    setSeen(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch { /* private mode: it just shows again next time */ }
  };

  const touch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  return (
    <AnimatePresence>
      {visible && (
        <Toast
          role="status"
          initial={{ opacity: 0, y: 30, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          <span className="icon"><InfoIcon /></span>
          <span>
            {touch ? (
              <>Toque em <b>Detalhes</b> embaixo de um jogo para ver preço, créditos e sinopse.</>
            ) : (
              <>Passe o mouse num jogo e clique em <b>Detalhes</b> (ou use o botão direito) para ver preço, créditos e sinopse.</>
            )}
          </span>
          <button type="button" onClick={dismiss}>Entendi</button>
        </Toast>
      )}
    </AnimatePresence>
  );
}
