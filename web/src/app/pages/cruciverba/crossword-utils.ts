// Porting letterale delle due funzioni pure di assets/js/crossword/main.js (nessuna dipendenza
// da stato o DOM, quindi restano funzioni libere invece di diventare metodi del servizio).
export function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function normalizeLetter(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[^a-z]/gi, '')
    .slice(0, 1)
    .toUpperCase();
}
