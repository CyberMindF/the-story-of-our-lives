import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { WORLD_PLACES } from '../../core/world-places';
import { matchesTodayDayMonth } from '../../core/day-month';
import { Block, DayContent } from '../bacheca-preview/bacheca.types';

// Emoji, rotta, disponibilità e ordine restano nel codice (documentazione/cms/planning-editor-contenuti.md,
// decisione #2 dell'inventario): solo nome e descrizione sono contenuto editoriale, letti da
// /api/mondo-bianco-cards e sovrascrivibili in modalità admin. L'elenco e l'ordine delle card
// non cambiano dall'editor — aggiungerne o toglierne una è comunque una modifica di codice.
interface CardOverride {
  name: string;
  description: string | null;
}

interface PlaceView {
  id: string;
  emoji: string;
  route: string;
  fallbackName: string;
  name: string;
  description: string | null;
}

interface CalendarEventApi {
  id: string;
  date: string;
  label: string;
  body: string;
}

interface LetterApi {
  id: number;
  author: string;
  body: string;
  createdAt: string;
}

interface BachecaDayApi {
  id: string;
  title: string | null;
  memoryDate: string | null;
  // #e14bis: serve il contenuto completo per scandire i blocchi con memoryDate propria (giorni
  // "collezione" come "I video", dove blocchi diversi hanno date reali diverse).
  content: DayContent;
}

// #e14bis: breve estratto di un blocco per la card del banner — caption se c'è, altrimenti tipo
// di blocco + titolo del giorno, coerente con quanto mostrato dall'editor (summary()).
function blockExcerpt(block: Block, dayTitle: string | null): string {
  const typeLabel: Record<Block['type'], string> = { text: 'Un ricordo', photo: 'Una foto', video: 'Un video', audio: 'Un audio', link: 'Un link' };
  if (block.type === 'text') return excerptOf(block.text);
  if ((block.type === 'photo' || block.type === 'link') && block.caption) return excerptOf(block.caption);
  return `${typeLabel[block.type]} da "${dayTitle ?? 'un giorno della Bacheca'}"`;
}

// #e14 ("Ecco qualcosa che è successo oggi"): forma unificata delle tre fonti (Calendario,
// Lettere, Bacheca) per il banner in home, con un deep-link che riapre il dettaglio nella
// pagina di origine.
interface TodayMemory {
  type: 'calendario' | 'lettera' | 'bacheca';
  id: string;
  title: string;
  excerpt: string;
  year: number;
  route: string;
  queryParams: Record<string, string>;
  thumbnailUrl: string | null;
}

// Stesso pattern usato in bacheca-preview.ts e altre 7 pagine (nessun helper condiviso oggi,
// vedi #e18 in prossimi sviluppi.md per la pulizia futura di questa duplicazione già esistente).
function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}

function excerptOf(text: string, maxLength = 140): string {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength).trimEnd()}…` : trimmed;
}

@Component({
  selector: 'app-mondo-bianco',
  standalone: true,
  imports: [RouterLink, AppShell, AudioPlayer, EditorialText, FormsModule],
  styleUrls: ['../../../styles/pages/world.css'],
  templateUrl: './mondo-bianco.html'
})
export class MondoBianco {
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);

  protected readonly songUrl = '/api/media/cuffiette/canzoni/il-cerchio.mp3';
  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly overrides = signal<Map<string, CardOverride>>(new Map());
  protected readonly places = computed<PlaceView[]>(() =>
    WORLD_PLACES.filter((place): place is typeof place & { route: string } => Boolean(place.primary && place.route)).map((place) => {
      const override = this.overrides().get(place.id);
      return { ...place, name: override?.name ?? place.fallbackName, description: override?.description ?? null };
    })
  );

  protected readonly editingId = signal<string | null>(null);
  protected readonly draftName = signal('');
  protected readonly draftDescription = signal('');
  protected readonly formError = signal('');

  // #e14: banner "Ecco qualcosa che è successo oggi", fisso per tutto il giorno, nessuno
  // stato server — solo un filtro client-side su dati già pubblici altrove.
  private readonly calendarEvents = signal<CalendarEventApi[]>([]);
  private readonly letters = signal<LetterApi[]>([]);
  private readonly bachecaDays = signal<BachecaDayApi[]>([]);

  protected readonly todayMemories = computed<TodayMemory[]>(() => {
    const memories: TodayMemory[] = [];

    for (const event of this.calendarEvents()) {
      if (matchesTodayDayMonth(event.date)) {
        memories.push({
          type: 'calendario',
          id: event.id,
          title: event.label,
          excerpt: excerptOf(event.body),
          year: Number(event.date.slice(0, 4)),
          route: '/calendario',
          queryParams: { evento: event.id },
          thumbnailUrl: null
        });
      }
    }

    for (const letter of this.letters()) {
      if (matchesTodayDayMonth(letter.createdAt)) {
        memories.push({
          type: 'lettera',
          id: String(letter.id),
          title: `Una lettera di ${letter.author}`,
          excerpt: excerptOf(letter.body),
          year: Number(letter.createdAt.slice(0, 4)),
          route: '/lettere',
          queryParams: { lettera: String(letter.id) },
          thumbnailUrl: null
        });
      }
    }

    for (const day of this.bachecaDays()) {
      // #e14bis: i blocchi con data propria hanno la precedenza sulla data dell'intero giorno.
      // Un giorno può avere decine di blocchi datati sulla stessa data (es. 30 foto scattate lo
      // stesso giorno): mostrarle tutte affollerebbe il banner, quindi si raccolgono i blocchi
      // che cadono su oggi e se ne pesca **uno solo a caso** per rappresentare il giorno.
      const matchingBlocks: { rowIndex: number; colIndex: number; blockIndex: number; block: Block }[] = [];
      day.content.rows.forEach((row, rowIndex) => {
        row.columns.forEach((column, colIndex) => {
          column.blocks.forEach((block, blockIndex) => {
            if (block.memoryDate && matchesTodayDayMonth(block.memoryDate)) {
              matchingBlocks.push({ rowIndex, colIndex, blockIndex, block });
            }
          });
        });
      });

      if (matchingBlocks.length > 0) {
        const { rowIndex, colIndex, blockIndex, block } = matchingBlocks[Math.floor(Math.random() * matchingBlocks.length)];
        memories.push({
          type: 'bacheca',
          id: day.id,
          title: day.title ?? 'Un giorno nella Bacheca',
          excerpt: blockExcerpt(block, day.title),
          year: Number(block.memoryDate!.slice(0, 4)),
          route: '/bacheca',
          queryParams: { giorno: day.id, blocco: `${rowIndex}-${colIndex}-${blockIndex}` },
          thumbnailUrl: block.type === 'photo' ? mediaUrl(block.thumbKey ?? block.key) : null
        });
      }

      if (matchingBlocks.length === 0 && day.memoryDate && matchesTodayDayMonth(day.memoryDate)) {
        memories.push({
          type: 'bacheca',
          id: day.id,
          title: day.title ?? 'Un giorno nella Bacheca',
          excerpt: 'Un ricordo dalla Bacheca dei Ricordi.',
          year: Number(day.memoryDate.slice(0, 4)),
          route: '/bacheca',
          queryParams: { giorno: day.id },
          thumbnailUrl: null
        });
      }
    }

    return memories.sort((a, b) => a.year - b.year);
  });

  constructor() {
    void this.load();
    void this.loadTodayMemories();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/mondo-bianco-cards', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const result = await this.api.readApiResponse<{ cards?: { id: string; name: string; description: string | null }[] }>(response);
      const map = new Map<string, CardOverride>();
      for (const card of result.cards ?? []) {
        map.set(card.id, { name: card.name, description: card.description });
      }
      this.overrides.set(map);
    } catch (error) {
      console.error('Errore nel caricamento delle card del Mondo Bianco:', error);
    }
  }

  private async loadTodayMemories(): Promise<void> {
    try {
      const [eventsRes, lettersRes, daysRes] = await Promise.all([
        fetch('/api/calendar-events', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/letters', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/bacheca-days', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      ]);
      if (eventsRes.ok) {
        const data = await this.api.readApiResponse<{ events?: CalendarEventApi[] }>(eventsRes);
        this.calendarEvents.set(data.events ?? []);
      }
      if (lettersRes.ok) {
        const data = await this.api.readApiResponse<{ letters?: LetterApi[] }>(lettersRes);
        this.letters.set(data.letters ?? []);
      }
      if (daysRes.ok) {
        const data = await this.api.readApiResponse<{ days?: BachecaDayApi[] }>(daysRes);
        this.bachecaDays.set(data.days ?? []);
      }
    } catch (error) {
      console.error('Errore nel caricamento di "Ecco qualcosa che è successo oggi":', error);
    }
  }

  protected startEdit(place: PlaceView): void {
    this.draftName.set(place.name);
    this.draftDescription.set(place.description ?? '');
    this.formError.set('');
    this.editingId.set(place.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async submitEdit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const name = this.draftName().trim();
    if (!name) {
      this.formError.set('Il nome non può essere vuoto.');
      return;
    }

    const ok = await this.api.sendAuthenticatedJson(`/api/mondo-bianco-cards/${id}`, {
      name,
      description: this.draftDescription().trim()
    }, 'PUT');

    if (!ok) {
      this.formError.set('Non è stato possibile salvare la card.');
      return;
    }

    this.editingId.set(null);
    await this.load();
  }
}
