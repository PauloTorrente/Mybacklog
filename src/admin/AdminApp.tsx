import { useEffect, useMemo, useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { amiiboSeries } from '../data/amiibo';
import { amiiboKey, formatRange, useCatalog, type CatalogEntry } from '../data/catalog';
import { games, platformById, platforms } from '../data/games';

/** One row of the admin list: a game or an amiibo, with its catalogue key. */
interface Item {
  key: string;
  title: string;
  where: string;
  group: string;
  owned: boolean;
  kind: 'game' | 'amiibo';
}

const items: Item[] = [
  ...games.map((g) => ({ key: g.id, title: g.title, where: platformById.get(g.platformId)?.name ?? '', group: g.platformId, owned: g.status === 'owned', kind: 'game' as const })),
  ...amiiboSeries.flatMap((s) =>
    s.items.map((a) => ({ key: amiiboKey(a.id), title: a.line ? `${a.name} (${a.line})` : a.name, where: `amiibo · ${s.name}`, group: 'amiibo', owned: a.owned, kind: 'amiibo' as const })),
  ),
];

const FIELDS: [keyof CatalogEntry, string][] = [
  ['publisher', 'Distribuidora'],
  ['developer', 'Desenvolvedora'],
  ['released', 'Ano de lançamento'],
  ['director', 'Direção'],
  ['composer', 'Trilha sonora (compositor)'],
];

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 16px 4rem;
  display: grid;
  gap: 1rem;

  h1 { font-size: 1.8rem; font-weight: 700; margin: 0; }
  a { color: ${({ theme }) => theme.color.aquaInk}; }
`;

const Panel = styled.section`
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #fff;
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px rgba(30, 64, 120, 0.08);
  padding: 1rem 1.1rem;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 380px) 1fr;
  gap: 1rem;
  align-items: start;
  @media (max-width: ${({ theme }) => theme.bp.md}) { grid-template-columns: 1fr; }
`;

const Field = styled.label`
  display: grid;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.color.muted};

  input, textarea, select {
    font: inherit;
    font-weight: 400;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.color.ink};
    padding: 0.55rem 0.7rem;
    border-radius: 0.6rem;
    border: 1px solid ${({ theme }) => theme.color.line};
    background: #fff;
  }
  textarea { min-height: 150px; resize: vertical; }
  input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aqua}; outline-offset: 1px; }
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 40px;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.color.aquaInk : theme.color.line)};
  background: ${({ theme, $primary }) => ($primary ? theme.color.aquaInk : '#fff')};
  color: ${({ $primary, theme }) => ($primary ? '#fff' : theme.color.ink)};
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.55; cursor: default; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.color.aqua}; outline-offset: 2px; }
`;

const List = styled.ul`
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  max-height: 65vh;
  overflow: auto;

  button {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    text-align: left;
    padding: 0.5rem 0.6rem;
    border: 0;
    border-radius: 0.6rem;
    background: none;
    cursor: pointer;
    font: inherit;
  }
  button:hover { background: rgba(78, 205, 196, 0.08); }
  button[aria-current='true'] { background: rgba(78, 205, 196, 0.18); }
  .t { font-weight: 700; font-size: 0.9rem; }
  .w { display: block; font-size: 0.75rem; color: ${({ theme }) => theme.color.muted}; }
  .tags { font-size: 0.72rem; white-space: nowrap; color: ${({ theme }) => theme.color.aquaInk}; align-self: center; }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
`;

const Note = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.color.muted};
`;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data as T;
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel as="form" onSubmit={submit} style={{ maxWidth: 380, display: 'grid', gap: '0.75rem' }}>
      <Field>
        Senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
      </Field>
      {error && <Note role="alert" style={{ color: '#D64545' }}>{error}</Note>}
      <Button $primary type="submit" disabled={busy || !password}>Entrar</Button>
    </Panel>
  );
}

function Editor({ item, onSaved }: { item: Item; onSaved: (entry: CatalogEntry) => void }) {
  const { catalog, rate } = useCatalog();
  const saved = catalog[item.key] ?? {};
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = catalog[item.key] ?? {};
    setForm(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, String(v)])));
    setStatus('');
    // Reload the form only when another item is picked, not after every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.key]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const min = form.priceMin ? Number(form.priceMin) : undefined;
  const max = form.priceMax ? Number(form.priceMax) : undefined;
  const brl = rate && (min !== undefined || max !== undefined) ? formatRange(min, max, 'BRL', rate.rate) : null;
  const dirty = JSON.stringify(Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))) !== JSON.stringify(Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, String(v)])));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const entry = await api<CatalogEntry>(`/api/catalog/${item.key}`, { method: 'PUT', body: JSON.stringify(form) });
      onSaved(entry);
      setForm(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, String(v)])));
      setStatus('Salvo ✓');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const lookup = async () => {
    setBusy(true);
    setStatus('Buscando no Wikidata e na Wikipédia…');
    try {
      const r = await api<Record<string, string>>(`/api/lookup?title=${encodeURIComponent(item.title)}`);
      if (r.error) throw new Error(r.error);
      // Only fill what's empty: what you typed by hand wins.
      setForm((f) => {
        const next = { ...f };
        for (const k of ['publisher', 'developer', 'released', 'director', 'composer', 'synopsis']) if (!next[k] && r[k]) next[k] = r[k];
        return next;
      });
      setStatus(`Encontrado: ${r.source}. Confira e clique em Salvar.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Erro na busca');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel as="form" onSubmit={save} style={{ display: 'grid', gap: '0.9rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{item.title}</h2>
        <Note>{item.where} · {item.owned ? 'na coleção' : 'lista de desejos'}</Note>
      </div>

      <Row>
        <Field>
          Preço mínimo (€, usado)
          <input inputMode="decimal" value={form.priceMin ?? ''} onChange={(e) => set('priceMin', e.target.value.replace(',', '.'))} />
        </Field>
        <Field>
          Preço máximo (€, usado)
          <input inputMode="decimal" value={form.priceMax ?? ''} onChange={(e) => set('priceMax', e.target.value.replace(',', '.'))} />
        </Field>
      </Row>
      {brl && <Note>≈ {brl} (cotação de {rate?.date})</Note>}

      {item.kind === 'game' && (
        <>
          <Row>
            {FIELDS.map(([k, label]) => (
              <Field key={k}>
                {label}
                <input value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </Row>
          <Field>
            Sinopse
            <textarea value={form.synopsis ?? ''} onChange={(e) => set('synopsis', e.target.value)} />
          </Field>
        </>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <Button $primary type="submit" disabled={busy || !dirty}>Salvar</Button>
        {item.kind === 'game' && (
          <Button type="button" onClick={lookup} disabled={busy}>Preencher pela Wikipédia</Button>
        )}
        <Note role="status">{status}</Note>
      </div>
    </Panel>
  );
}

export default function AdminApp() {
  const { catalog, setEntry, rate } = useCatalog();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [onlyWish, setOnlyWish] = useState(true);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api<{ admin: boolean }>('/api/me').then((r) => setAdmin(r.admin)).catch(() => setAdmin(false));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (group === 'all' || i.group === group) &&
        (!onlyWish || !i.owned) &&
        (!onlyMissing || catalog[i.key]?.priceMin === undefined) &&
        (!q || i.title.toLowerCase().includes(q)),
    );
  }, [query, group, onlyWish, onlyMissing, catalog]);

  const item = items.find((i) => i.key === selected) ?? null;
  const wish = items.filter((i) => !i.owned);
  const priced = wish.filter((i) => catalog[i.key]?.priceMin !== undefined || catalog[i.key]?.priceMax !== undefined).length;

  const logout = async () => {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    setAdmin(false);
  };

  return (
    <Page>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <h1>Admin da coleção</h1>
        <a href="/">← voltar ao site</a>
        {admin && <Button type="button" onClick={logout} style={{ marginLeft: 'auto' }}>Sair</Button>}
      </div>

      {admin === null && <Note>Carregando…</Note>}
      {admin === false && <Login onDone={() => setAdmin(true)} />}

      {admin && (
        <>
          <Note>
            {priced} de {wish.length} itens da lista de desejos têm preço.
            {rate && ` Cotação de hoje: € 1 = R$ ${rate.rate.toFixed(4).replace('.', ',')}.`}
          </Note>
          <Layout>
            <Panel>
              <Field>
                Buscar
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome do jogo ou amiibo" />
              </Field>
              <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.6rem' }}>
                <Field>
                  Plataforma
                  <select value={group} onChange={(e) => setGroup(e.target.value)}>
                    <option value="all">Todas</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    <option value="amiibo">Amiibos</option>
                  </select>
                </Field>
                <label style={{ fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={onlyWish} onChange={(e) => setOnlyWish(e.target.checked)} /> Só lista de desejos
                </label>
                <label style={{ fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> Só sem preço
                </label>
              </div>
              <Note style={{ marginTop: '0.6rem' }}>{shown.length} itens</Note>
              <List>
                {shown.map((i) => {
                  const e = catalog[i.key];
                  const price = formatRange(e?.priceMin, e?.priceMax, 'EUR');
                  return (
                    <li key={i.key}>
                      <button type="button" aria-current={i.key === selected} onClick={() => setSelected(i.key)}>
                        <span>
                          <span className="t">{i.title}</span>
                          <span className="w">{i.where}{i.owned ? ' · tenho' : ''}</span>
                        </span>
                        <span className="tags">
                          {price ?? ''}
                          {e?.synopsis ? ' · ℹ︎' : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </List>
            </Panel>
            {item ? (
              <Editor key={item.key} item={item} onSaved={(entry) => setEntry(item.key, entry)} />
            ) : (
              <Panel>
                <Note>Escolha um jogo ou amiibo na lista para cadastrar preço e informações.</Note>
              </Panel>
            )}
          </Layout>
        </>
      )}
    </Page>
  );
}
