// Tipi condivisi dal cruciverba — rispecchiano la forma dei dati letti da /api/crossword-words
// (in precedenza data.json) e le strutture derivate
// costruite da assets/js/crossword/main.js (validateData/buildWordEntry).
export type CrosswordDirection = 'O' | 'V';

export interface CrosswordWordData {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
}

export interface CrosswordData {
  words: CrosswordWordData[];
}

export interface ValidatedWordData extends CrosswordWordData {
  id: string;
}

export interface WordCell {
  row: number;
  col: number;
  key: string;
  solution: string;
  index: number;
}

export interface WordEntry {
  id: string;
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
  cells: WordCell[];
}

export interface CellState {
  key: string;
  row: number;
  col: number;
  solution: string;
  wordIds: string[];
  startWordIds: string[];
}

export interface CrosswordDimensions {
  rows: number;
  cols: number;
  rowOffset: number;
  colOffset: number;
}

export interface PersistentAnswer {
  wordId: string;
  currentAnswer: string;
}

export type ValidationMark = 'correct' | 'error';

export interface SelectWordOptions {
  focusFirstEmpty?: boolean;
  scroll?: boolean;
  focus?: boolean;
}

export interface SelectCellOptions {
  preferCurrentDirection?: boolean;
  preferDirectionFromArrow?: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
  scroll?: boolean;
  focus?: boolean;
}
