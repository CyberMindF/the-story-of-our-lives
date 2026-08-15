// Palette per il foil metallico (superficie continua, non a mosaico — vedi il commento in
// metallic-foil.ts sulla differenza col componente crushed-ice). Porting del prototipo fornito
// da Rory: 4 preset pronti + derivazione automatica da un colore singolo per crearne altri
// senza dover scrivere una nuova palette a mano ogni volta.

export type MetalPreset = 'gold' | 'silver' | 'bronze' | 'copper';

export interface MetalPalette {
  shadow: string;
  dark: string;
  mid: string;
  main: string;
  light: string;
  highlight: string;
  white: string;
}

// Valori "R G B" (senza virgole, per rgb(var(--x) / alpha)) presi 1:1 dal prototipo CSS.
export const METAL_PRESETS: Record<MetalPreset, MetalPalette> = {
  gold: {
    shadow: '72 43 2',
    dark: '118 76 5',
    mid: '174 123 19',
    main: '215 169 46',
    light: '243 210 103',
    highlight: '255 238 167',
    white: '255 253 228'
  },
  silver: {
    shadow: '55 60 64',
    dark: '91 99 105',
    mid: '145 153 158',
    main: '185 193 197',
    light: '222 228 230',
    highlight: '244 247 247',
    white: '255 255 255'
  },
  bronze: {
    shadow: '66 29 10',
    dark: '102 50 19',
    mid: '151 82 34',
    main: '190 111 50',
    light: '226 158 83',
    highlight: '246 201 133',
    white: '255 239 209'
  },
  copper: {
    shadow: '69 28 16',
    dark: '116 48 27',
    mid: '168 75 42',
    main: '205 105 64',
    light: '237 158 111',
    highlight: '255 205 170',
    white: '255 239 222'
  }
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixColor(a: readonly [number, number, number], b: readonly [number, number, number], amount: number): [number, number, number] {
  return [Math.round(a[0] + (b[0] - a[0]) * amount), Math.round(a[1] + (b[1] - a[1]) * amount), Math.round(a[2] + (b[2] - a[2]) * amount)];
}

function rgbTriplet(color: readonly [number, number, number]): string {
  return `${color[0]} ${color[1]} ${color[2]}`;
}

// Deriva l'intera scala scuro→bianco da un solo colore esadecimale, così si possono creare
// metalli custom (rosso, blu, viola...) senza aggiungere un nuovo preset a mano.
export function metalPaletteFromColor(hex: string): MetalPalette {
  const base = hexToRgb(hex);
  const black: [number, number, number] = [0, 0, 0];
  const white: [number, number, number] = [255, 255, 255];

  return {
    shadow: rgbTriplet(mixColor(base, black, 0.68)),
    dark: rgbTriplet(mixColor(base, black, 0.42)),
    mid: rgbTriplet(mixColor(base, black, 0.16)),
    main: rgbTriplet(base),
    light: rgbTriplet(mixColor(base, white, 0.38)),
    highlight: rgbTriplet(mixColor(base, white, 0.70)),
    white: rgbTriplet(mixColor(base, white, 0.91))
  };
}
