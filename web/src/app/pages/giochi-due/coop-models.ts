export interface CoopCatalogItem { id: string; title: string; emoji: string; description: string; }
interface Actor { id: number; name: string; }
interface PuzzleBase { id: string; title: string; emoji: string; instructions: string; objective: string; hints: string[]; difficulty: string; solved: boolean; }
export interface CodePuzzle extends PuzzleBase { type: 'code'; role: string; ready: boolean; sequence: string[]; legend: {symbol: string; number: number}[]; }
export interface MazePuzzle extends PuzzleBase { type: 'maze'; size: number; position: number; goal: number; keys: number[]; collected: number[]; turn: number; myTurn: boolean; edges: [number, number][]; }
export interface CircuitPuzzle extends PuzzleBase { type: 'circuit'; size: number; switches: {index: number; on: boolean; lights: number[]}[]; lights: {index: number; on: boolean; target: boolean}[]; }
export interface OrderPuzzle extends PuzzleBase { type: 'order'; items: {id: string; emoji: string; name: string}[]; order: string[]; clues: string[]; confirmed: boolean[]; }
export interface DossierPuzzle extends PuzzleBase { type: 'dossier'; suspects: {id: string; name: string; emoji: string; attributes: {color: string; item: string; place: string}}[]; clues: string[]; votes: (string | null)[]; }
export interface MosaicPuzzle extends PuzzleBase { type: 'mosaic'; size: number; grid: boolean[]; ownedCells: number[]; rowClues: number[][] | null; columnClues: number[][] | null; confirmed: boolean[]; }
export interface BalancePuzzle extends PuzzleBase { type: 'balance'; weights: {index: number; value: number; selected: boolean}[]; target: number; selectedCounts: number[]; confirmed: boolean[]; }
export interface PipesPuzzle extends PuzzleBase { type: 'pipes'; size: number; cells: {index: number; ports: number[] | null; owned: boolean; lit: boolean | null}[]; source: number; sink: number; confirmed: boolean[]; }
export type CoopPuzzle = CodePuzzle | MazePuzzle | CircuitPuzzle | OrderPuzzle | DossierPuzzle | MosaicPuzzle | BalancePuzzle | PipesPuzzle;
export interface CoopResult { type: string; title: string; emoji: string; errors: number; hints: number; moves: number; durationMs: number; }
export interface ModernCoopRoom {
  schema: 2; id: string; owner: Actor; partner: Actor | null; status: string; mode: string; difficulty: string;
  round: number; total: number; seat: number; userSeat: number; errors: number; roundErrors: number; roundMoves: number;
  hintsUsed: number; nextReady: boolean[]; restartReady: boolean[]; message: string; results: CoopResult[];
  startedAt: number; finishedAt: number | null; puzzle: CoopPuzzle | null;
}
export interface LegacyCoopRoom {
  schema?: undefined; id: string; owner: Actor; partner: Actor | null; status: string; round: number; errors: number;
  role: string; ready: boolean; sequence: string[]; legend: {symbol: string; number: number}[]; lastWrong: boolean; instruction: string | null;
}
export interface CoopState {
  version: number; catalog?: CoopCatalogItem[]; room?: ModernCoopRoom | LegacyCoopRoom | null;
  history?: {id: string; status: string; errors: number; at: number; mode?: string; difficulty?: string; results?: CoopResult[]}[];
}
