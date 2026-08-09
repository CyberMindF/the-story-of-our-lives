import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-clues',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <aside class="clues-panel" aria-labelledby="clues-title">
      <div class="clues-panel-header">
        <h2 id="clues-title">Definizioni</h2>
        <button
          id="previous-clue-button"
          class="mobile-sheet-nav mobile-sheet-nav-previous"
          type="button"
          aria-label="Ricordo precedente"
          (pointerdown)="preserveGridFocusDuringNavigation($event)"
          (click)="crossword.selectAdjacentWord(-1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button
          #mobileSheetToggle
          id="mobile-sheet-toggle"
          class="mobile-sheet-toggle"
          type="button"
          [attr.aria-expanded]="crossword.mobileSheetOpen()"
          aria-controls="clues-list"
          (click)="crossword.toggleMobileClues()"
        >
          <span class="mobile-clue-copy" aria-live="polite">
            <span class="mobile-clue-kicker" id="mobile-clue-kicker">{{ crossword.mobileClueKicker() }}</span>
            <span class="mobile-clue-text" id="mobile-clue-text">{{ crossword.mobileClueText() }}</span>
          </span>
          <span class="mobile-sheet-chevron" aria-hidden="true"></span>
          <span class="sr-only">{{ crossword.mobileSheetOpen() ? 'Chiudi la lista delle definizioni' : 'Apri la lista delle definizioni' }}</span>
        </button>
        <button
          id="next-clue-button"
          class="mobile-sheet-nav mobile-sheet-nav-next"
          type="button"
          aria-label="Ricordo successivo"
          (pointerdown)="preserveGridFocusDuringNavigation($event)"
          (click)="crossword.selectAdjacentWord(1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <ol #cluesList id="clues-list" class="clues-list">
        @for (entry of crossword.words(); track entry.id) {
          <li class="clue-item">
            <button
              #clueButton
              type="button"
              class="clue-button"
              [class.is-selected]="crossword.currentWordId() === entry.id"
              [class.is-complete]="crossword.completedWordIds().has(entry.id)"
              [attr.aria-current]="crossword.currentWordId() === entry.id"
              [attr.data-word-id]="entry.id"
              (click)="selectWord(entry.id)"
            >
              <span class="clue-order">{{ entry.id }}.</span><span>{{ entry.clue }}</span>
            </button>
          </li>
        }
      </ol>
    </aside>
  `
})
export class CrosswordClues implements AfterViewInit, OnDestroy {
  @ViewChild('cluesList') private cluesListRef?: ElementRef<HTMLElement>;
  @ViewChild('mobileSheetToggle') private mobileSheetToggleRef?: ElementRef<HTMLElement>;
  @ViewChildren('clueButton') private clueButtonRefs?: QueryList<ElementRef<HTMLElement>>;

  private resizeObserver: ResizeObserver | null = null;
  private fallbackResizeHandler: (() => void) | null = null;

  constructor(protected readonly crossword: CrosswordService) {}

  ngAfterViewInit(): void {
    this.registerElements();
    this.observeMobileSheetHeader();
    this.clueButtonRefs?.changes.subscribe(() => this.registerClueButtons());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.fallbackResizeHandler) {
      window.removeEventListener('resize', this.fallbackResizeHandler);
      this.fallbackResizeHandler = null;
    }
  }

  protected selectWord(wordId: string): void {
    this.crossword.selectWord(wordId, { focusFirstEmpty: true, scroll: true });
    if (window.matchMedia('(max-width: 640px)').matches) {
      this.crossword.setMobileCluesOpen(false);
    }
  }

  protected preserveGridFocusDuringNavigation(event: PointerEvent): void {
    if (document.body.classList.contains('keyboard-open')) {
      event.preventDefault();
    }
  }

  private registerElements(): void {
    this.crossword.registerCluesList(this.cluesListRef?.nativeElement ?? null);
    this.registerClueButtons();
  }

  private registerClueButtons(): void {
    const entries =
      this.clueButtonRefs?.toArray().map((ref) => {
        const button = ref.nativeElement;
        return [button.dataset['wordId'] || '', button] as const;
      }) ?? [];

    this.crossword.registerClueButtons(entries.filter(([wordId]) => Boolean(wordId)));
  }

  private observeMobileSheetHeader(): void {
    const updatePeekHeight = () => {
      const height = Math.ceil(this.mobileSheetToggleRef?.nativeElement.getBoundingClientRect().height || 0);
      if (height > 0) {
        document.documentElement.style.setProperty('--mobile-sheet-peek-height', `${height}px`);
      }
    };

    updatePeekHeight();

    if (typeof ResizeObserver === 'function' && this.mobileSheetToggleRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(updatePeekHeight);
      this.resizeObserver.observe(this.mobileSheetToggleRef.nativeElement);
      return;
    }

    this.fallbackResizeHandler = updatePeekHeight;
    window.addEventListener('resize', updatePeekHeight);
  }
}
