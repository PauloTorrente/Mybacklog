import amiibo from '../assets/logos/amiibo.png';
import ds from '../assets/logos/ds.png';
import dsStack from '../assets/logos/ds-stack.png';
import playstation from '../assets/logos/playstation.svg';
import switchLogo from '../assets/logos/switch.png';
import threeDs from '../assets/logos/3ds.png';
import threeDsStack from '../assets/logos/3ds-stack.png';
import wii from '../assets/logos/wii.png';
import type { ShelfId } from './games';

/** Consoles without a logo file fall back to a text mark. */
export const platformLogos: Partial<Record<ShelfId, string>> = {
  switch: switchLogo,
  '3ds': threeDs,
  ds,
  wii,
  ps4: playstation,
  amiibo,
};

/** "NINTENDO" over the big mark: the wide DS/3DS logos would be a thin strip on a square cube face. */
export const platformStackedLogos: Partial<Record<ShelfId, string>> = {
  '3ds': threeDsStack,
  ds: dsStack,
};

/**
 * Cube colours per console. Switch and PS4 wear their brand colour (red, blue) with a white logo;
 * the handhelds and the Wii stay white/grey like the hardware.
 */
export const platformCubes: Record<ShelfId, { from: string; to: string; logo: 'fill' | 'white' | 'plain' }> = {
  switch: { from: '#FF1F2E', to: '#E60012', logo: 'fill' }, // the logo file is already a red square
  '3ds': { from: '#FFFFFF', to: '#F3E3E6', logo: 'plain' },
  ds: { from: '#FFFFFF', to: '#E6EBF1', logo: 'plain' },
  wii: { from: '#FFFFFF', to: '#EEF3F7', logo: 'plain' },
  ps4: { from: '#2F6FE4', to: '#003791', logo: 'white' },
  amiibo: { from: '#FFFFFF', to: '#F1F5F9', logo: 'plain' },
};
