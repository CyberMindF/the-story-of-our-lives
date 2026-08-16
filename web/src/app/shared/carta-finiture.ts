export const CARTA_FINITURE = ['flat', 'argento', 'oro', 'onice', 'smeraldo', 'rubino', 'zaffiro', 'diamante'] as const;

export type CartaFinitura = (typeof CARTA_FINITURE)[number];
export type CartaFamiglia = 'bianca' | 'metallo' | 'gemma';
export type CartaFinituraGemma = Extract<CartaFinitura, 'onice' | 'smeraldo' | 'rubino' | 'zaffiro' | 'diamante'>;

interface CartaFinituraMeta {
  label: string;
  famiglia: CartaFamiglia;
  metalPreset?: 'silver' | 'gold';
}

// Unica fonte frontend per ordine, nomi e famiglia delle finiture. Il database continua a
// salvare soltanto `finitura`: la famiglia e' una proprieta' visiva derivata, non un dato da
// duplicare e mantenere sincronizzato anche lato server.
export const CARTA_FINITURA_META: Record<CartaFinitura, CartaFinituraMeta> = {
  flat: { label: 'Bianca', famiglia: 'bianca' },
  argento: { label: 'Argento', famiglia: 'metallo', metalPreset: 'silver' },
  oro: { label: 'Oro', famiglia: 'metallo', metalPreset: 'gold' },
  onice: { label: 'Onice', famiglia: 'gemma' },
  smeraldo: { label: 'Smeraldo', famiglia: 'gemma' },
  rubino: { label: 'Rubino', famiglia: 'gemma' },
  zaffiro: { label: 'Zaffiro', famiglia: 'gemma' },
  diamante: { label: 'Diamante', famiglia: 'gemma' }
};

export const CARTA_FINITURA_LABELS = Object.fromEntries(
  CARTA_FINITURE.map((finitura) => [finitura, CARTA_FINITURA_META[finitura].label])
) as Record<CartaFinitura, string>;
