import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { ContentMessage } from '../../shared/content-message/content-message';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { seededRotation } from '../../shared/random';

interface Letter {
  id: number;
  author: string;
  isMine: boolean;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

// Porting fedele di assets/js/lettere/main.js, inclusa l'animazione FLIP busta→lettera. Questa
// parte resta imperativa (misure DOM dirette con getBoundingClientRect) come nell'originale:
// non esiste un equivalente dichiarativo pulito in Angular per "anima da un elemento reale a
// un altro", e forzarla dentro @angular/animations sarebbe più complesso e più rischioso che
// portare la stessa logica già funzionante così com'è.
@Component({
  selector: 'app-lettere',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, ContentMessage, EditorialText],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/lettere.css'],
  templateUrl: './lettere.html'
})
export class Lettere implements OnInit, OnDestroy {
  protected readonly submission = inject(FormSubmission);
  private readonly route = inject(ActivatedRoute);
  @ViewChild('letterDialog') private dialogRef?: ElementRef<HTMLDialogElement>;
  @ViewChild('dialogPaper') private dialogPaperRef?: ElementRef<HTMLDivElement>;
  @ViewChild('pagerViewport') private pagerViewportRef?: ElementRef<HTMLDivElement>;
  @ViewChild('pagerContent') private pagerContentRef?: ElementRef<HTMLDivElement>;

  protected readonly letters = signal<Letter[]>([]);
  protected readonly loadError = signal(false);

  protected readonly dialogLetter = signal<Letter | null>(null);
  protected readonly dialogRotation = signal(0);
  protected readonly dialogSizeCategory = signal<'bigliettino' | 'media' | 'foglio-a4'>('media');

  // Sfogliare invece di scorrere: il testo scorre in colonne CSS larghe quanto il viewport
  // (una colonna = una pagina), e qui si tiene solo l'indice pagina + le metriche lette dal
  // DOM per calcolare quante pagine ci sono e di quanto traslare la striscia di colonne.
  protected readonly letterPage = signal(0);
  protected readonly letterPageCount = signal(1);
  protected readonly pageTurnDirection = signal<'next' | 'previous' | null>(null);
  private pageStridePx = 0;
  private pageTurnSwapTimer?: number;
  private pageTurnEndTimer?: number;

  private activeCardEl: HTMLElement | null = null;
  private readonly onWindowResize = () => this.recomputePages();
  private readonly onFontsLoaded = () => this.recomputePages();

  async ngOnInit(): Promise<void> {
    await this.loadLetters();
    window.addEventListener('resize', this.onWindowResize);
    document.fonts?.addEventListener?.('loadingdone', this.onFontsLoaded);
  }

  ngOnDestroy(): void {
    this.clearPageTurnTimers();
    window.removeEventListener('resize', this.onWindowResize);
    document.fonts?.removeEventListener?.('loadingdone', this.onFontsLoaded);
  }

  protected formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
  }

  protected isUnread(letter: Letter): boolean {
    return !letter.isMine && !letter.readAt;
  }

  private letterRotation(id: number): number {
    return seededRotation(id);
  }

  // Un biglietto corto resta piccolo, una lettera lunga diventa un vero foglio.
  private letterSizeCategory(bodyLength: number): 'bigliettino' | 'media' | 'foglio-a4' {
    if (bodyLength < 240) {
      return 'bigliettino';
    }
    if (bodyLength > 900) {
      return 'foglio-a4';
    }
    return 'media';
  }

  private flipTransform(fromRect: DOMRect, toRect: DOMRect): string {
    const scaleX = fromRect.width / toRect.width;
    const scaleY = fromRect.height / toRect.height;
    const translateX = fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
    const translateY = fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);
    return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY}) rotate(0deg)`;
  }

  protected async openLetter(letter: Letter, cardEl: HTMLElement): Promise<void> {
    const dialog = this.dialogRef?.nativeElement;
    const paper = this.dialogPaperRef?.nativeElement;
    if (!dialog || !paper) {
      return;
    }

    this.activeCardEl = cardEl;
    const envelopeEl = cardEl.querySelector('.envelope');
    const fromRect = envelopeEl?.getBoundingClientRect();

    this.dialogLetter.set(letter);
    this.dialogRotation.set(this.letterRotation(letter.id));
    this.dialogSizeCategory.set(this.letterSizeCategory(letter.body.length));
    this.letterPage.set(0);

    dialog.showModal();

    // Doppio rAF: il primo lascia ad Angular il tempo di aggiornare il DOM con la nuova
    // lettera, il secondo lascia al browser il tempo di calcolare il layout delle colonne
    // prima che si legga scrollWidth. Il listener sui font (ngOnInit) ricalcola di nuovo se
    // Caveat finisce di caricare dopo, cambiando le metriche del testo.
    requestAnimationFrame(() => requestAnimationFrame(() => this.recomputePages()));

    if (fromRect) {
      const toRect = paper.getBoundingClientRect();
      paper.style.transition = 'none';
      paper.style.opacity = '0.5';
      paper.style.transform = this.flipTransform(fromRect, toRect);
      paper.getBoundingClientRect(); // forza il reflow prima di rimuovere lo stato iniziale

      requestAnimationFrame(() => {
        paper.style.transition = '';
        paper.style.transform = '';
        paper.style.opacity = '';
      });
    }

    if (!letter.isMine && !letter.readAt) {
      try {
        const response = await fetch(`/api/letters/${letter.id}`, { method: 'POST', credentials: 'same-origin' });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.readAt) {
          this.letters.update((list) => list.map((entry) => (entry.id === letter.id ? { ...entry, readAt: result.readAt } : entry)));
        }
      } catch (error) {
        console.error('Errore nel segnare la lettera come letta:', error);
      }
    }
  }

  protected closeLetterAnimated(): void {
    if (this.pageTurnDirection()) {
      return;
    }
    const dialog = this.dialogRef?.nativeElement;
    const paper = this.dialogPaperRef?.nativeElement;
    const envelopeEl = this.activeCardEl?.querySelector('.envelope');

    if (!dialog || !paper || !envelopeEl || !dialog.open) {
      dialog?.close();
      return;
    }

    const toRect = envelopeEl.getBoundingClientRect();
    const fromRect = paper.getBoundingClientRect();
    paper.style.transition = 'transform .35s ease, opacity .3s ease';
    paper.style.opacity = '0.4';
    paper.style.transform = this.flipTransform(toRect, fromRect);

    const onEnd = () => {
      paper.removeEventListener('transitionend', onEnd);
      dialog.close();
      paper.style.transition = '';
      paper.style.transform = '';
      paper.style.opacity = '';
    };
    paper.addEventListener('transitionend', onEnd);
  }

  // Il column-width della pagina è il testo stesso a "chiederlo": si legge quanto è largo il
  // viewport e lo si impone come larghezza di colonna, poi si conta quante colonne il browser
  // ha effettivamente creato dallo scrollWidth risultante. Nessun testo viene spezzato a mano.
  private recomputePages(): void {
    if (!this.dialogRef?.nativeElement.open) {
      return;
    }
    const viewport = this.pagerViewportRef?.nativeElement;
    const content = this.pagerContentRef?.nativeElement;
    if (!viewport || !content) {
      return;
    }
    const columnWidth = viewport.clientWidth;
    if (columnWidth <= 0) {
      return;
    }
    content.style.columnWidth = `${columnWidth}px`;
    const gap = parseFloat(getComputedStyle(content).columnGap) || 0;
    this.pageStridePx = columnWidth + gap;
    const pages = Math.max(1, Math.round((content.scrollWidth + gap) / this.pageStridePx));
    this.letterPageCount.set(pages);
    this.letterPage.update((page) => Math.min(page, pages - 1));
  }

  protected pagerTransform(): string {
    return `translateX(${-(this.letterPage() * this.pageStridePx)}px)`;
  }

  protected nextPage(): void {
    this.turnPage('next');
  }

  protected prevPage(): void {
    this.turnPage('previous');
  }

  private turnPage(direction: 'next' | 'previous'): void {
    if (this.pageTurnDirection()) return;
    const delta = direction === 'next' ? 1 : -1;
    const destination = this.letterPage() + delta;
    if (destination < 0 || destination >= this.letterPageCount()) return;

    this.pageTurnDirection.set(direction);
    this.pageTurnSwapTimer = window.setTimeout(() => this.letterPage.set(destination), 180);
    this.pageTurnEndTimer = window.setTimeout(() => {
      this.pageTurnDirection.set(null);
      this.clearPageTurnTimers();
    }, 420);
  }

  private clearPageTurnTimers(): void {
    if (this.pageTurnSwapTimer !== undefined) window.clearTimeout(this.pageTurnSwapTimer);
    if (this.pageTurnEndTimer !== undefined) window.clearTimeout(this.pageTurnEndTimer);
    this.pageTurnSwapTimer = undefined;
    this.pageTurnEndTimer = undefined;
  }

  protected onDialogClick(event: MouseEvent): void {
    if (!this.pageTurnDirection() && event.target === this.dialogRef?.nativeElement) {
      this.closeLetterAnimated();
    }
  }

  protected onDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeLetterAnimated();
  }

  private async loadLetters(): Promise<void> {
    try {
      const response = await fetch('/api/letters', { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { letters?: Letter[] };
      this.letters.set(data.letters || []);
      this.openRequestedLetter();
    } catch (error) {
      console.error('Errore nel caricamento delle lettere:', error);
      this.loadError.set(true);
    }
  }

  // #e14: deep-link dal banner "Ecco qualcosa che è successo oggi" (?lettera=<id>) — apre
  // direttamente la lettera richiesta, stessa animazione dell'apertura manuale.
  private openRequestedLetter(): void {
    const letterId = this.route.snapshot.queryParamMap.get('lettera');
    if (!letterId) {
      return;
    }
    const letter = this.letters().find((entry) => String(entry.id) === letterId);
    if (!letter) {
      return;
    }
    requestAnimationFrame(() => {
      const cardEl = document.getElementById(`letter-card-${letter.id}`);
      if (cardEl) {
        void this.openLetter(letter, cardEl);
      }
    });
  }

  protected async submitLetter(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/letters',
      pendingMessage: 'Sto inviando la lettera...',
      successMessage: 'Lettera inviata.',
      afterSuccess: () => this.loadLetters()
    });
  }
}
