import { AfterViewInit, Component, ElementRef, Input, OnDestroy, SecurityContext, ViewChild, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const SAVE_DEBOUNCE_MS = 800;

export const NOTE_TEXT_COLORS = [
  { value: 'inherit', label: 'Predefinito' },
  { value: '#f0dbb3', label: 'Oro' },
  { value: '#e28b8b', label: 'Rosso' },
  { value: '#8fc98f', label: 'Verde' },
  { value: '#8fb8e0', label: 'Azzurro' }
];

// Estratto da i-tuoi-appunti (autosalvataggio con debounce, /api/gdr/notes) per poterlo
// riusare anche dentro il pannello di gioco (GdrPanel), non solo sulla pagina dedicata di
// "Il Prezzo della Verità" — stessa logica, parametrizzata da `adventure` invece di una
// costante fissa. Diventato un editor "rich text" leggero (contenteditable + document.
// execCommand per grassetto/sottolineato/colore) su richiesta di Rory: il testo salvato ora è
// HTML, non più testo semplice. Il contenuto arriva da un servizio di sola scrittura tra due
// account fidati, ma viene comunque passato da DomSanitizer prima di finire nel DOM — non è
// mai bypassata la sanitizzazione di Angular, anche se qui si scrive a sé stessi.
@Component({
  selector: 'app-gdr-notes-editor',
  standalone: true,
  imports: [],
  templateUrl: './gdr-notes-editor.html',
  styleUrl: './gdr-notes-editor.css'
})
export class GdrNotesEditor implements AfterViewInit, OnDestroy {
  @Input({ required: true }) adventure!: string;
  @ViewChild('editorEl') private readonly editorEl!: ElementRef<HTMLDivElement>;

  protected readonly disabled = signal(true);
  protected readonly statusMessage = signal('Sto caricando i tuoi appunti...');
  protected readonly colors = NOTE_TEXT_COLORS;

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly domSanitizer: DomSanitizer) {}

  async ngAfterViewInit(): Promise<void> {
    await this.loadNotes();
  }

  ngOnDestroy(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private async loadNotes(): Promise<void> {
    this.disabled.set(true);
    this.statusMessage.set('Sto caricando i tuoi appunti...');

    try {
      const response = await fetch(`/api/gdr/notes?adventure=${this.adventure}`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { body?: string };
      const safe = this.domSanitizer.sanitize(SecurityContext.HTML, data.body || '') || '';
      this.editorEl.nativeElement.innerHTML = safe;
      this.statusMessage.set('');
    } catch (error) {
      console.error('Errore nel caricamento degli appunti:', error);
      this.statusMessage.set('Non è stato possibile caricare gli appunti salvati.');
    } finally {
      this.disabled.set(false);
    }
  }

  protected onInput(): void {
    this.statusMessage.set('Sto salvando...');
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => void this.saveNotes(), SAVE_DEBOUNCE_MS);
  }

  // mousedown con preventDefault, non click: altrimenti il contenteditable perde il focus (e
  // quindi la selezione di testo) prima che il comando di formattazione venga eseguito.
  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected applyBold(): void {
    document.execCommand('bold');
    this.onInput();
  }

  protected applyUnderline(): void {
    document.execCommand('underline');
    this.onInput();
  }

  // execCommand('foreColor', ...) non capisce la parola chiave CSS 'inherit' come valore —
  // per "colore predefinito" serve il colore testo effettivo del tema attivo in quel momento
  // (diverso per ogni tema), letto dallo stile calcolato invece di un hex fisso che stonerebbe
  // in almeno un tema su cinque.
  protected applyColor(color: string): void {
    const resolved = color === 'inherit' ? getComputedStyle(this.editorEl.nativeElement).color : color;
    document.execCommand('foreColor', false, resolved);
    this.onInput();
  }

  private async saveNotes(): Promise<void> {
    try {
      const formData = new FormData();
      formData.set('adventure', this.adventure);
      formData.set('body', this.editorEl.nativeElement.innerHTML);
      const response = await fetch('/api/gdr/notes', { method: 'POST', credentials: 'same-origin', body: formData });
      if (!response.ok) {
        throw new Error(`Salvataggio fallito: ${response.status}`);
      }
      this.statusMessage.set('Salvato.');
    } catch (error) {
      console.error('Errore nel salvataggio degli appunti:', error);
      this.statusMessage.set('Non è stato possibile salvare, riprova.');
    }
  }
}
