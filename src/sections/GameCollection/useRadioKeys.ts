import { useRef, type KeyboardEvent } from 'react';

/** Arrow/Home/End navigation for a role="radiogroup": moves selection and focus together. */
export function useRadioKeys<T>(ids: T[], value: T, onChange: (id: T) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const current = ids.indexOf(value);
    const last = ids.length - 1;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (current === last ? 0 : current + 1)
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (current === 0 ? last : current - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(ids[next]);
    refs.current[next]?.focus();
  }

  const register = (i: number) => (el: HTMLButtonElement | null) => {
    refs.current[i] = el;
  };

  return { onKeyDown, register };
}
