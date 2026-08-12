export interface PhotoBlock {
  type: 'photo';
  key: string;
  thumbKey?: string;
  caption?: string;
}

export interface TextBlock {
  type: 'text';
  text: string;
  link?: { href: string; label: string };
}

export interface LinkBlock {
  type: 'link';
  href: string;
  caption?: string;
}

export interface MediaBlock {
  type: 'audio' | 'video';
  key: string;
  label?: string;
  vertical?: boolean;
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
}

export interface PeriodRow {
  id: string;
  title: string;
  position: number;
}
