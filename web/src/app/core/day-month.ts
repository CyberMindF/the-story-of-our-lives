// #e14 ("Ecco qualcosa che è successo oggi"): confronto giorno+mese ignorando l'anno, usato
// dal banner in home per trovare eventi Calendario/Lettere/Bacheca capitati nella stessa data
// di anni passati. Vive in core/ perché è logica di dominio riusabile (non markup) — pronta se
// domani anche Calendario o Lettere vorranno un badge "successo oggi" nella propria pagina.
export function matchesTodayDayMonth(isoDate: string, today: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) {
    return false;
  }
  const [, , month, day] = match;
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  return month === todayMonth && day === todayDay;
}
