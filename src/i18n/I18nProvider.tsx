import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { genreLabels, htmlLang, messages, type Lang, type MessageKey } from './messages';

type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Picks `${base}.one` / `${base}.other` by `count`. */
  plural: (base: 'games.count' | 'amiibo.count', count: number) => string;
  genre: (genre: string) => string;
}

const I18nContext = createContext<I18n | null>(null);
const STORAGE_KEY = 'lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'es' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = navigator.language.slice(0, 2);
  return nav === 'es' || nav === 'en' ? nav : 'pt';
}

function interpolate(text: string, vars?: Vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : text;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = htmlLang[lang];
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const t = (key: MessageKey, vars?: Vars) => interpolate(messages[lang][key], vars);
    const rules = new Intl.PluralRules(htmlLang[lang]);
    return {
      lang,
      setLang,
      t,
      plural: (base, count) => t(`${base}.${rules.select(count) === 'one' ? 'one' : 'other'}`, { count }),
      genre: (genre) => genreLabels[lang][genre] ?? genre,
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
