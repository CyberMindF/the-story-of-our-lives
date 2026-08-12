import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface CalendarEvent {
  id: string;
  date: string;
  label: string;
  body: string;
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

// Editor dedicato del Calendario (planning editor contenuti.md, Fase 7): gli eventi vivono ora
// in calendar_events via /api/calendar-events, non più in content/calendar.json — niente più
// vincolo "esattamente 29 date" (aveva senso solo per uno snapshot statico, non per una
// raccolta che l'admin può far crescere). L'ordine resta sempre cronologico: qui non serve un
// campo position, a differenza di raccolte come la Bacheca.
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [AppShell, EditorialText, FormsModule, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/calendar.css'],
  templateUrl: './calendario.html'
})
export class Calendario {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly events = signal<CalendarEvent[]>([]);
  protected readonly yearGroups = computed(() => this.groupByYear(this.events()));
  protected readonly countLabel = signal('Caricamento delle date…');

  protected readonly adding = signal(false);
  protected readonly newDate = signal('');
  protected readonly newLabel = signal('');
  protected readonly newBody = signal('');
  protected readonly addError = signal('');

  protected readonly editingId = signal<string | null>(null);
  protected readonly editLabel = signal('');
  protected readonly editBody = signal('');
  protected readonly editError = signal('');

  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/calendar-events', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ events?: CalendarEvent[] }>(response);
      const events = result.events ?? [];
      this.events.set(events);
      this.countLabel.set(`${events.length} date da ricordare`);
    } catch (error) {
      console.error('Impossibile caricare il Calendario.', error);
      this.countLabel.set('Le date non sono disponibili in questo momento.');
    }
  }

  private groupByYear(events: CalendarEvent[]): YearGroup[] {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    const years = new Map<string, CalendarCellView[]>();

    sorted.forEach((event, visualIndex) => {
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

  protected startAdd(): void {
    this.newDate.set('');
    this.newLabel.set('');
    this.newBody.set('');
    this.addError.set('');
    this.adding.set(true);
  }

  protected cancelAdd(): void {
    this.adding.set(false);
  }

  protected async submitAdd(): Promise<void> {
    const date = this.newDate();
    const label = this.newLabel().trim();
    const body = this.newBody().trim();
    if (!date || !label || !body) {
      this.addError.set('Compila data, etichetta e testo.');
      return;
    }

    const ok = await this.api.sendAuthenticatedJson('/api/calendar-events', { date, label, body }, 'POST');
    if (!ok) {
      this.addError.set('Non è stato possibile aggiungere la data.');
      return;
    }

    this.adding.set(false);
    await this.load();
  }

  protected startEdit(event: CalendarEvent): void {
    this.editingId.set(event.id);
    this.editLabel.set(event.label);
    this.editBody.set(event.body);
    this.editError.set('');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async submitEdit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const label = this.editLabel().trim();
    const body = this.editBody().trim();
    if (!label || !body) {
      this.editError.set('Etichetta e testo non possono essere vuoti.');
      return;
    }

    const ok = await this.api.sendAuthenticatedJson(`/api/calendar-events/${id}`, { label, body }, 'PUT');
    if (!ok) {
      this.editError.set('Non è stato possibile salvare le modifiche.');
      return;
    }

    this.editingId.set(null);
    await this.load();
  }

  protected requestDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  protected cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.deleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/calendar-events/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }
}
