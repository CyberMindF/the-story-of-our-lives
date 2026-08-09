import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-clues',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './crossword-clues.html'
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
