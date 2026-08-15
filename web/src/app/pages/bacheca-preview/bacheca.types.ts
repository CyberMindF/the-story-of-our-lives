export interface PhotoBlock {
  type: 'photo';
  key: string;
  thumbKey?: string;
  caption?: string;
  // #e14bis: data facoltativa (YYYY-MM-DD) del singolo blocco, per i giorni "collezione" dove
  // blocchi diversi hanno date reali diverse (es. "I video"). Ha priorità sulla memoryDate del
  // giorno nel banner "successo oggi" in home.
  memoryDate?: string;
}

export interface TextBlock {
  type: 'text';
  text: string;
  link?: { href: string; label: string };
  memoryDate?: string;
}

export interface LinkBlock {
  type: 'link';
  href: string;
  caption?: string;
  memoryDate?: string;
}

export interface MediaBlock {
  type: 'audio' | 'video';
  key: string;
  label?: string;
  vertical?: boolean;
  memoryDate?: string;
}

export type Block = PhotoBlock | TextBlock | LinkBlock | MediaBlock;

export interface Column {
  width: number;
  blocks: Block[];
}

export interface Row {
  columns: Column[];
}

export interface DayContent {
  rows: Row[];
}

export interface DayRow {
  id: string;
  periodId: string;
  slug: string;
  title: string | null;
  content: DayContent;
  position: number;
  // #e14: data facoltativa (YYYY-MM-DD) confrontata giorno+mese con oggi per il banner
  // "successo oggi" in home. null finché nessuno la compila per quel giorno.
  memoryDate: string | null;
}

export interface PeriodRow {
  id: string;
  title: string;
  position: number;
}
