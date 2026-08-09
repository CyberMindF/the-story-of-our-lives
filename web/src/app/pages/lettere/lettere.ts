import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { ContentMessage } from '../../shared/content-message/content-message';

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
  imports: [AppShell, FormStatus, ContentMessage],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/lettere.css'],
  templateUrl: './lettere.html'
})
export class Lettere implements OnInit {
  protected readonly submission = inject(FormSubmission);
  @ViewChild('letterDialog') private dialogRef?: ElementRef<HTMLDialogElement>;
  @ViewChild('dialogPaper') private dialogPaperRef?: ElementRef<HTMLDivElement>;

  protected readonly letters = signal<Letter[]>([]);
  protected readonly loadError = signal(false);

  protected readonly dialogLetter = signal<Letter | null>(null);
  protected readonly dialogRotation = signal(0);
  protected readonly dialogSizeCategory = signal<'bigliettino' | 'media' | 'foglio-a4'>('media');

  private activeCardEl: HTMLElement | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadLetters();
  }

  protected formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
  }

  protected isUnread(letter: Letter): boolean {
    return !letter.isMine && !letter.readAt;
  }

  private letterRotation(id: number): number {
    const seed = Math.sin(id * 999.17) * 10000;
    const fraction = seed - Math.floor(seed);
    return (fraction * 2 - 1) * 2.4;
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

    dialog.showModal();

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

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef?.nativeElement) {
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
    } catch (error) {
      console.error('Errore nel caricamento delle lettere:', error);
      this.loadError.set(true);
    }
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
