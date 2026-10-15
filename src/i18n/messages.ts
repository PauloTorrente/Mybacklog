export type Lang = 'pt' | 'es' | 'en';

const pt = {
  'lang.label': 'Idioma',
  'games.title': 'Minha coleção de jogos',
  'games.dream': 'Fazendo meu sonho de infância ser realidade.',
  'games.total': 'jogos na coleção',
  'games.totalWishlist': 'na lista de desejos',
  'games.flipHint': 'clique para virar a caixa',
  'games.noCover': 'capa em breve',
  'games.pick': 'Clique num cubo para abrir a estante',
  'games.cubes': 'Consoles',
  'games.released': 'Lançado em {year}',
  'games.topGenre': 'gênero mais comum: {genre} ({count})',
  'games.count.one': '{count} jogo',
  'games.count.other': '{count} jogos',
  'amiibo.count.one': '{count} amiibo',
  'amiibo.count.other': '{count} amiibos',
  'amiibo.owned': 'de {total} na coleção',
  'games.unit': 'jogos',
  'games.genres': 'Gênero',
  'games.filterGenre': 'Filtrar por gênero',
  'games.distribution': 'Por gênero',
  'games.others': 'Outros',
  'games.empty': 'Nenhum jogo encontrado',
  'games.clear': 'Limpar filtros',
};

export type MessageKey = keyof typeof pt;

const es: Record<MessageKey, string> = {
  'lang.label': 'Idioma',
  'games.title': 'Mi colección de juegos',
  'games.dream': 'Haciendo realidad mi sueño de infancia.',
  'games.total': 'juegos en la colección',
  'games.totalWishlist': 'en la lista de deseos',
  'games.flipHint': 'haz clic para girar la caja',
  'games.noCover': 'portada pronto',
  'games.pick': 'Haz clic en un cubo para abrir la estantería',
  'games.cubes': 'Consolas',
  'games.released': 'Lanzada en {year}',
  'games.topGenre': 'género más común: {genre} ({count})',
  'games.count.one': '{count} juego',
  'games.count.other': '{count} juegos',
  'amiibo.count.one': '{count} amiibo',
  'amiibo.count.other': '{count} amiibos',
  'amiibo.owned': 'de {total} en la colección',
  'games.unit': 'juegos',
  'games.genres': 'Género',
  'games.filterGenre': 'Filtrar por género',
  'games.distribution': 'Por género',
  'games.others': 'Otros',
  'games.empty': 'No se encontró ningún juego',
  'games.clear': 'Limpiar filtros',
};

const en: Record<MessageKey, string> = {
  'lang.label': 'Language',
  'games.title': 'My game collection',
  'games.dream': 'Making my childhood dream come true.',
  'games.total': 'games in the collection',
  'games.totalWishlist': 'on the wishlist',
  'games.flipHint': 'click to flip the case',
  'games.noCover': 'cover coming soon',
  'games.pick': 'Click a cube to open its shelf',
  'games.cubes': 'Consoles',
  'games.released': 'Released {year}',
  'games.topGenre': 'most common genre: {genre} ({count})',
  'games.count.one': '{count} game',
  'games.count.other': '{count} games',
  'amiibo.count.one': '{count} amiibo',
  'amiibo.count.other': '{count} amiibos',
  'amiibo.owned': 'of {total} in the collection',
  'games.unit': 'games',
  'games.genres': 'Genre',
  'games.filterGenre': 'Filter by genre',
  'games.distribution': 'By genre',
  'games.others': 'Others',
  'games.empty': 'No games found',
  'games.clear': 'Clear filters',
};

/** Genre labels come from the data (in Portuguese); these only translate the display. */
const genresEs: Record<string, string> = {
  Aventura: 'Aventura', Plataforma: 'Plataformas', Luta: 'Lucha', Corrida: 'Carreras',
  Esporte: 'Deportes', Terror: 'Terror', 'Tiro espacial': 'Disparos espaciales',
  'Mundo aberto': 'Mundo abierto', Pesca: 'Pesca', 'Simulação': 'Simulación',
};
const genresEn: Record<string, string> = {
  Aventura: 'Adventure', Plataforma: 'Platformer', Luta: 'Fighting', Corrida: 'Racing',
  Esporte: 'Sports', Terror: 'Horror', 'Tiro espacial': 'Space shooter',
  'Mundo aberto': 'Open world', Pesca: 'Fishing', 'Simulação': 'Simulation',
};

export const messages: Record<Lang, Record<MessageKey, string>> = { pt, es, en };
export const genreLabels: Record<Lang, Record<string, string>> = { pt: {}, es: genresEs, en: genresEn };
export const htmlLang: Record<Lang, string> = { pt: 'pt-BR', es: 'es', en: 'en' };
