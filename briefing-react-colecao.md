# Briefing: seção "Coleção de Jogos" (React)

## Contexto
Crie a seção/página **Coleção de Jogos** do meu portfólio. Ela segue o design system **Aero Console** (Frutiger Aero + menu do Wii + Nintendo DS) que já está no projeto. Não invente outro visual.

- **Stack (não trocar):** React, Styled-Components e Framer Motion. As fontes Quicksand e Nunito vêm do `@fontsource`.
- **Dados:** use o arquivo `games.json` em anexo. Coloque em `src/data/games.json` e não escreva a lista dentro dos componentes.
  - Formato: `platforms[]` com `{ id, name, short, year, games: [ [titulo, genero], ... ] }`.
  - Converta para objetos tipados num único ponto (`src/data/games.ts`): `{ id, title, genre, platformId }`. O `id` é um slug de `platformId + title`.

## O que construir
1. **Cabeçalho da seção:** título "Minha coleção de jogos", total de jogos e a frase em coral "Fazendo meu sonho de infância ser realidade."
2. **Seletor de console em "canais do Wii":** uma grade de cartões de vidro, um por console (Switch, 3DS, DS, Wii, PS4) mais o cartão "Todos". Cada cartão mostra o nome e a quantidade de jogos. O canal ativo leva borda aqua e o anel de foco `0 0 0 3px` aqua a 22%.
3. **Filtro de gênero:** pills arredondadas geradas a partir dos dados (não fixas no código). Pode marcar mais de um gênero. Mostre a contagem em cada pill e esconda os gêneros com 0 jogos no console selecionado.
4. **Busca por título:** ignora maiúsculas e acentos ("pokemon" encontra "Pokémon"), com debounce de 150 ms.
5. **Lista de jogos:** cards de vidro numa grade responsiva (1 coluna até 480px, 2 até 900px, 3 acima). Cada card tem o título, o chip de gênero (RPG em aqua, os outros em neutro) e o console em texto mono pequeno quando o filtro é "Todos".
6. **Barra de distribuição por gênero:** uma barra horizontal empilhada que reage aos filtros. Use só CSS, sem biblioteca de gráficos.
7. **Estado vazio:** "Nenhum jogo encontrado", com um botão "Limpar filtros".

## Regras de design (do brief Aero Console)
- Fundo em degradê `#E0F0FF → #FFFFFF`, com orbes desfocados fixos nos cantos (`pointer-events: none`).
- Vidro: `rgba(255,255,255,.7)`, `backdrop-filter: blur(12px)`, borda branca de 1px e raio de 1.5rem. **No mobile, troque o blur por vidro opaco a 85%.**
- Acentos: aqua `#4ECDC4` para ações e coral `#FF6B6B` só na frase emocional. Nenhuma terceira cor de acento.
- Animação: os cards sobem 40px em 0.5s, com stagger de 0.1s **limitado aos primeiros 12 cards**, `viewport once`. Ao trocar o filtro, use `AnimatePresence` + `layout`, sem animar a página inteira de novo. Respeite `prefers-reduced-motion`.
- Nada de fundo escuro com neon nem cantos retos.

## Arquitetura
```
src/sections/GameCollection/
  index.tsx              // compõe tudo
  PlatformChannels.tsx
  GenreFilter.tsx
  SearchBox.tsx
  GameGrid.tsx / GameCard.tsx
  GenreBar.tsx
  useGameFilters.ts      // estado + useMemo com os dados filtrados
  styles.ts
src/data/games.json, games.ts
```
- O estado dos filtros fica num único hook (`useGameFilters`) e é sincronizado com a URL (`?console=ds&genre=RPG&q=zelda`) para dar para compartilhar o link.
- Os textos passam pelo i18n que o portfólio já tem (PT/ES/EN). Os nomes dos jogos não são traduzidos.

## Acessibilidade
- Os canais são `role="radiogroup"`, com navegação por setas. Os gêneros são botões com `aria-pressed`.
- A contagem de resultados é anunciada num `aria-live="polite"` ("12 jogos").
- Contraste AA no texto sobre o vidro. O foco fica visível em todos os controles.

## Critérios de aceite
- [ ] O total exibido é **132** e as contagens por console são 43 / 32 / 33 / 21 / 3.
- [ ] Filtrar DS + RPG + busca "dragon" mostra só os Dragon Quest do DS.
- [ ] Recarregar a página com os parâmetros da URL restaura os filtros.
- [ ] Sem layout shift ao trocar o filtro e Lighthouse Accessibility ≥ 95.
- [ ] Funciona a 360px de largura sem scroll horizontal.
- [ ] Nenhum dado de jogo escrito à mão nos componentes.

## Fora do escopo (não fazer agora)
Capas dos jogos, backend, edição da lista pelo site e notas ou reviews.

## Como entregar
Primeiro mostre o plano de componentes e os tipos em poucas linhas. Depois implemente. Termine com a lista de arquivos criados e como testar os critérios de aceite.
