import { covers } from '../../data/covers';
import { platformById, type Game } from '../../data/games';
import { wallpapers } from '../../data/wallpapers';
import type { InfoTarget } from './InfoMenu';

/** What the details strip shows for a game (used by the shelf and by the amiibo game list). */
export function gameTarget(game: Game): InfoTarget {
  return {
    key: game.id,
    title: game.title,
    subtitle: platformById.get(game.platformId)?.name ?? '',
    owned: game.status === 'owned',
    image: covers.get(game.id)?.front,
    wallpaper: wallpapers.get(game.id),
    kind: 'game',
  };
}
