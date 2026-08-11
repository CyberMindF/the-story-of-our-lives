// Fase lunare calcolata, non chiamata a un servizio esterno (diverso da #a4, la pagina "il
// cielo" dedicata, che invece userà un'API vera) — per un elemento di sfondo sempre presente
// su ogni pagina non ha senso dipendere dalla rete: qui basta un riferimento noto (l'ultima
// luna nuova nota) e la durata media del mese sinodico.
const KNOWN_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000;

export const MOON_PHASE_LABEL = [
  'Luna nuova',
  'Luna crescente',
  'Primo quarto',
  'Gibbosa crescente',
  'Luna piena',
  'Gibbosa calante',
  'Ultimo quarto',
  'Luna calante'
] as const;

export interface MoonRenderParams {
  // Lato sempre "almeno metà" scuro/chiaro (il resto lo decide l'ellisse). Prima della metà
  // del ciclo (crescente) è la metà sinistra a partire scura, dopo (calante) la destra.
  fixedSide: 'left' | 'right';
  // Larghezza dell'ellisse del terminatore, in frazione del raggio (0 = linea, 1 = tutto il
  // disco) — vedi la nota sotto per la derivazione.
  ellipseWidthFraction: number;
  // Se true l'ellisse è scura (si somma alla metà fissa, fasi vicine a luna nuova); se false è
  // chiara (si sottrae alla metà fissa, fasi vicine a luna piena).
  ellipseIsShadow: boolean;
}

// 0 = luna nuova, 0.5 = luna piena, 1 torna a coincidere con 0.
export function moonPhaseFraction(date: Date): number {
  const cycles = (date.getTime() - KNOWN_NEW_MOON_UTC_MS) / SYNODIC_MONTH_MS;
  const fraction = cycles - Math.floor(cycles);
  return fraction;
}

export function moonPhaseLabel(fraction: number): string {
  return MOON_PHASE_LABEL[Math.round(fraction * 8) % 8];
}

// Geometria del terminatore lunare: per un angolo di fase theta (0 = nuova, PI = piena, 2*PI
// di nuovo nuova), il confine luce/ombra proiettato sul disco è una mezza ellisse con raggio
// verticale pari al raggio del disco e raggio orizzontale pari a raggio*cos(theta). Sommando
// (o sottraendo) quell'ellisse — centrata sulla linea mediana verticale — a una metà del
// disco sempre scura (sinistra se crescente, destra se calante) si ottiene esattamente la
// forma a falce/gibbosa corretta ai 4 punti cardinali (nuova/primo quarto/piena/ultimo
// quarto) e una forma liscia e coerente nelle fasi intermedie — verificato numericamente
// (area scura attesa vs. ottenuta) prima di scriverlo, non solo "a occhio".
export function moonRenderParams(fraction: number): MoonRenderParams {
  const theta = fraction * 2 * Math.PI;
  const cosTheta = Math.cos(theta);
  return {
    fixedSide: fraction < 0.5 ? 'left' : 'right',
    ellipseWidthFraction: Math.abs(cosTheta),
    ellipseIsShadow: cosTheta >= 0
  };
}
