import Delaunator from 'delaunator';

// Foil olografico "crushed ice" a mosaico irregolare, con luce calcolata per frammento invece
// che con gradienti CSS mossi (bocciati più volte da Rory: sembravano un riflettore che
// insegue il mouse o una striscia che "finisce" ai bordi). Porting del prototipo fornito da
// Rory: punti su una griglia disturbata, triangolati con Delaunay, ogni triangolo riceve una
// "normale" ottica finta fissa — quando il mouse si allontana o avvicina alla direzione di
// quella normale, il triangolo si illumina o si spegne, così a muovere il mouse si accendono
// frammenti diversi invece che l'intera trama in blocco o un unico punto che la segue.
//
// La geometria (punti/triangoli/normali) è calcolata UNA VOLTA SOLA per l'intera app e
// condivisa da tutte le istanze di <app-carta-tilt> (cache a livello di modulo): calcolare la
// triangolazione di centinaia di punti per ogni singola carta della griglia dell'album sarebbe
// sprecato, dato che la disposizione dei frammenti è la stessa per ogni carta della stessa
// finitura (coerente con le lamincard vere: un'intera tiratura usa lo stesso stampo del foil,
// solo il colore/l'illustrazione sotto cambia).

export interface HoloFragment {
  points: readonly [number, number, number, number, number, number]; // x1,y1,x2,y2,x3,y3 in 0..1
  cx: number;
  cy: number;
  nx: number;
  ny: number;
  baseBrightness: number;
  specularStrength: number;
  roughness: number;
  colorShift: number;
  sparkle: number;
}

type RGB = readonly [number, number, number];

export interface HoloPalette {
  shadow: RGB;
  dark: RGB;
  base: RGB;
  bright: RGB;
  lime: RGB;
  warm: RGB;
  white: RGB;
}

// Una palette per finitura "pietrosa", sullo stesso schema a 7 livelli del prototipo (scuro →
// quasi bianco): il nome dei livelli resta "lime/warm" anche per le palette non verdi, sono
// solo le tappe dell'interpolazione verso il bianco, non colori letterali. L'oro NON è più qui:
// è metallo liscio (superficie continua), usa <app-metallic-foil> invece del mosaico — vedi
// metallic-foil/ e il commento in carta-tilt.ts sul perché sono due componenti distinti.
export const HOLO_PALETTES: Record<'onice' | 'smeraldo' | 'rubino' | 'zaffiro' | 'diamante', HoloPalette> = {
  onice: {
    shadow: [5, 7, 9],
    dark: [17, 19, 22],
    base: [38, 40, 44],
    bright: [72, 73, 76],
    lime: [122, 116, 105],
    warm: [205, 190, 155],
    white: [252, 246, 226]
  },
  smeraldo: {
    shadow: [43, 82, 7],
    dark: [70, 111, 10],
    base: [118, 157, 20],
    bright: [167, 196, 43],
    lime: [209, 225, 82],
    warm: [244, 239, 136],
    white: [255, 255, 244]
  },
  zaffiro: {
    shadow: [10, 40, 92],
    dark: [15, 63, 130],
    base: [26, 92, 176],
    bright: [58, 130, 209],
    lime: [110, 170, 230],
    warm: [180, 210, 248],
    white: [240, 248, 255]
  },
  rubino: {
    shadow: [82, 8, 26],
    dark: [122, 15, 40],
    base: [176, 21, 58],
    bright: [209, 51, 85],
    lime: [230, 110, 130],
    warm: [248, 180, 195],
    white: [255, 240, 244]
  },
  diamante: {
    shadow: [110, 110, 130],
    dark: [150, 150, 170],
    base: [190, 190, 210],
    bright: [215, 215, 235],
    lime: [232, 220, 245],
    warm: [245, 235, 250],
    white: [255, 255, 255]
  }
};

const WIDTH = 400;
const HEIGHT = 560;
const POINT_COUNT_COLUMNS = 14;
const POINT_COUNT_ROWS = 20;
const SEED = 123456;

function mulberry32(seed: number): () => number {
  let t = seed;
  return function random() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: RGB, b: RGB, t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgbString(color: readonly [number, number, number]): string {
  return `rgb(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])})`;
}

let cachedFragments: HoloFragment[] | null = null;

// Griglia disturbata (non una griglia perfetta, non punti puramente casuali): evita triangoli
// enormi o zone vuote, seed fisso così il mosaico è sempre identico tra un caricamento e l'altro.
function generateFragments(): HoloFragment[] {
  const random = mulberry32(SEED);
  const rand = (min: number, max: number) => min + random() * (max - min);

  const points: [number, number][] = [];
  const cellWidth = WIDTH / POINT_COUNT_COLUMNS;
  const cellHeight = HEIGHT / POINT_COUNT_ROWS;

  for (let row = 0; row <= POINT_COUNT_ROWS; row++) {
    for (let col = 0; col <= POINT_COUNT_COLUMNS; col++) {
      const baseX = col * cellWidth;
      const baseY = row * cellHeight;
      const jitterX = col === 0 || col === POINT_COUNT_COLUMNS ? 0 : rand(-cellWidth * 0.46, cellWidth * 0.46);
      const jitterY = row === 0 || row === POINT_COUNT_ROWS ? 0 : rand(-cellHeight * 0.46, cellHeight * 0.46);
      points.push([clamp(baseX + jitterX, 0, WIDTH), clamp(baseY + jitterY, 0, HEIGHT)]);
    }
  }

  const delaunay = Delaunator.from(points);
  const fragments: HoloFragment[] = [];

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    const a = points[delaunay.triangles[i]];
    const b = points[delaunay.triangles[i + 1]];
    const c = points[delaunay.triangles[i + 2]];
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const angle = rand(0, Math.PI * 2);

    fragments.push({
      points: [a[0] / WIDTH, a[1] / HEIGHT, b[0] / WIDTH, b[1] / HEIGHT, c[0] / WIDTH, c[1] / HEIGHT],
      cx: cx / WIDTH,
      cy: cy / HEIGHT,
      nx: Math.cos(angle),
      ny: Math.sin(angle),
      baseBrightness: rand(0.72, 1.12),
      specularStrength: rand(0.55, 1.35),
      roughness: rand(12, 52),
      colorShift: rand(-0.12, 0.18),
      sparkle: random() < 0.08 ? rand(1.25, 2) : 1
    });
  }

  return fragments;
}

export function getHoloFragments(): HoloFragment[] {
  if (!cachedFragments) {
    cachedFragments = generateFragments();
  }
  return cachedFragments;
}

function getBaseColor(fragment: HoloFragment, palette: HoloPalette): [number, number, number] {
  const variation = fragment.baseBrightness + fragment.colorShift;
  if (variation < 0.78) return lerpColor(palette.shadow, palette.dark, clamp((variation - 0.6) / 0.18));
  if (variation < 0.95) return lerpColor(palette.dark, palette.base, clamp((variation - 0.78) / 0.17));
  if (variation < 1.08) return lerpColor(palette.base, palette.bright, clamp((variation - 0.95) / 0.13));
  return lerpColor(palette.bright, palette.lime, clamp((variation - 1.08) / 0.18));
}

// Calcola fill+opacity per un frammento dato la posizione normalizzata (0..1) della luce
// (il mouse). Nessun DOM qui dentro: il chiamante decide come applicarlo (attributi SVG diretti
// per restare fuori da Angular change detection durante il pointermove, per performance).
export function computeFragmentStyle(fragment: HoloFragment, palette: HoloPalette, lightX: number, lightY: number): { fill: string; opacity: number } {
  const dx = lightX - fragment.cx;
  const dy = lightY - fragment.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const falloff = clamp(1 - distance / 0.52);

  const length = distance || 0.00001;
  const lx = dx / length;
  const ly = dy / length;
  const facing = fragment.nx * lx + fragment.ny * ly;
  const facingNormalized = clamp((facing + 1) * 0.5);

  const diffuse = Math.pow(facingNormalized, 2.2) * falloff * 0.35;

  let specular = Math.pow(facingNormalized, fragment.roughness);
  specular *= falloff * fragment.specularStrength * fragment.sparkle * 3.2;
  specular = clamp(specular);

  const hotspot = Math.pow(clamp(1 - distance / 0.18), 3);
  if (fragment.sparkle > 1 && facingNormalized > 0.82) {
    specular += hotspot * 0.35;
  }
  specular = clamp(specular);

  let color = getBaseColor(fragment, palette);
  color = lerpColor(color, palette.lime, clamp(diffuse));

  if (specular > 0) {
    const warmAmount = clamp(specular * 1.8);
    color = lerpColor(color, palette.warm, warmAmount);
    const whiteThreshold = clamp((specular - 0.28) / 0.72);
    color = lerpColor(color, palette.white, whiteThreshold);
  }

  return { fill: rgbString(color), opacity: 0.92 + specular * 0.08 };
}
