// Fase lunare calcolata, non chiamata a un servizio esterno (diverso da #a4, la pagina "il
// cielo" dedicata, che invece userà un'API vera) — per un elemento di sfondo sempre presente
// su ogni pagina non ha senso dipendere dalla rete: qui basta un riferimento noto (l'ultima
// luna nuova nota) e la durata media del mese sinodico.
const KNOWN_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000;

const MOON_PHASE_EMOJI = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] as const;
const MOON_PHASE_LABEL = [
  'Luna nuova',
  'Luna crescente',
  'Primo quarto',
  'Gibbosa crescente',
  'Luna piena',
  'Gibbosa calante',
  'Ultimo quarto',
  'Luna calante'
] as const;

// 0 = luna nuova, 0.5 = luna piena, 1 torna a coincidere con 0.
export function moonPhaseFraction(date: Date): number {
  const cycles = (date.getTime() - KNOWN_NEW_MOON_UTC_MS) / SYNODIC_MONTH_MS;
  const fraction = cycles - Math.floor(cycles);
  return fraction;
}

export function moonPhaseEmoji(fraction: number): string {
  return MOON_PHASE_EMOJI[Math.round(fraction * 8) % 8];
}

export function moonPhaseLabel(fraction: number): string {
  return MOON_PHASE_LABEL[Math.round(fraction * 8) % 8];
}
