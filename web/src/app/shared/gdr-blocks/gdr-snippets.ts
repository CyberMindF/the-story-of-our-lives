import { GdrBlockType } from './gdr-block.types';

export const SNIPPETS: Record<GdrBlockType, string> = {
  heading: '## Titolo',
  paragraph: 'Testo del paragrafo.',
  callout: '::: callout Lead\nTesto del callout.\n:::',
  image: '![Testo alternativo](/percorso/immagine.jpg "Didascalia opzionale")',
  npc_grid: '::: npc\n- image: /percorso/immagine.jpg\n  alt: Ritratto di Nome\n  name: Nome\n  description: Descrizione.\n:::',
  list: '- Primo elemento\n- Secondo elemento',
  table: '| Intestazione 1 | Intestazione 2 |\n| --- | --- |\n| Cella A1 | Cella B1 |'
};

export const SNIPPET_LABELS: Record<GdrBlockType, string> = {
  heading: 'Titolo',
  paragraph: 'Paragrafo',
  callout: 'Callout',
  image: 'Immagine',
  npc_grid: 'Griglia PNG',
  list: 'Elenco',
  table: 'Tabella'
};

export const BLOCK_TYPES: GdrBlockType[] = ['heading', 'paragraph', 'callout', 'image', 'npc_grid', 'list', 'table'];

