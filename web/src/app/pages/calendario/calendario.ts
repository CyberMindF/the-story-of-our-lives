import { Component, OnInit, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';

interface CalendarEvent {
  id: string;
  date: string;
  label: string;
  text: string;
}

interface CalendarCellView {
  event: CalendarEvent;
  accentClass: 'accent-green' | 'accent-red';
  monthLabel: string;
  dayLabel: string;
  yearLabel: string;
}

interface YearGroup {
  year: string;
  entries: CalendarCellView[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('it-IT', { month: 'long', timeZone: 'UTC' });

// Porting fedele di assets/js/calendar/main.js: stessa fonte dati (content/calendar.json),
// stessa validazione (esattamente 27 date, id univoci, formato data), stesso raggruppamento
// per anno e stessa alternanza di colore. La costruzione del DOM cella-per-cella
// dell'originale diventa un ciclo dichiarativo nel template (vedi calendario.html), non
// più createElement manuale — semplificazione naturale, stesso risultato visivo.
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/calendar.css'],
  templateUrl: './calendario.html'
})
export class Calendario implements OnInit {
  protected readonly yearGroups = signal<YearGroup[]>([]);
  protected readonly countLabel = signal('Caricamento delle date…');

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('/content/calendar.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { events: CalendarEvent[] };
      this.validateCalendar(data);
      this.yearGroups.set(this.groupByYear(data.events));
      this.countLabel.set(`${data.events.length} date custodite`);
    } catch (error) {
      console.error('Impossibile caricare il Calendario.', error);
      this.countLabel.set('Le date non sono disponibili in questo momento.');
    }
  }

  // Verifica quantità, identificatori e formato delle date senza correggere i dati.
  private validateCalendar(data: { events: CalendarEvent[] }): void {
    if (!Array.isArray(data.events) || data.events.length !== 27) {
      throw new Error('Il Calendario deve contenere esattamente 27 date.');
    }

    const ids = new Set<string>();
    data.events.forEach((event) => {
      if (ids.has(event.id)) {
        throw new Error(`Identificatore duplicato: ${event.id}.`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        throw new Error(`Data non valida: ${event.date}.`);
      }
      ids.add(event.id);
    });
  }

  // Usa direttamente l'ordine dell'array JSON e crea i gruppi annuali.
  private groupByYear(events: CalendarEvent[]): YearGroup[] {
    const years = new Map<string, CalendarCellView[]>();

    events.forEach((event, visualIndex) => {
      const year = event.date.slice(0, 4);
      if (!years.has(year)) {
        years.set(year, []);
      }
      years.get(year)!.push(this.toCellView(event, visualIndex));
    });

    return Array.from(years.entries()).map(([year, entries]) => ({ year, entries }));
  }

  private toCellView(event: CalendarEvent, visualIndex: number): CalendarCellView {
    const [year, month, day] = event.date.split('-').map(Number);
    return {
      event,
      accentClass: visualIndex % 2 === 0 ? 'accent-green' : 'accent-red',
      monthLabel: MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1))),
      dayLabel: String(day).padStart(2, '0'),
      yearLabel: String(year)
    };
  }
}
