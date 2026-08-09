import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { CrosswordClues } from './crossword-clues/crossword-clues';
import { CrosswordGrid } from './crossword-grid/crossword-grid';
import { CrosswordModals } from './crossword-modals/crossword-modals';
import { CrosswordService } from './crossword.service';
import { CrosswordToolbar } from './crossword-toolbar/crossword-toolbar';

// Porting fedele di tavolo-da-gioco/cruciverba/index.html + assets/js/crossword/main.js.
// La logica è nel servizio scoped alla pagina; qui restano shell, lifecycle e i listener
// globali che dipendono dall'esistenza reale della vista (pagehide, viewport mobile).
@Component({
  selector: 'app-cruciverba',
  standalone: true,
  imports: [AppShell, CrosswordToolbar, CrosswordGrid, CrosswordClues, CrosswordModals],
  providers: [CrosswordService],
  styleUrls: ['../../../styles/pages/crossword.css'],
  // Il foglio storico deve raggiungere anche grid, indizi e modali, ora separati in componenti.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './cruciverba.html'
})
export class Cruciverba implements OnInit, AfterViewInit, OnDestroy {
  protected readonly beforeLogout = () => this.crossword.trackCrosswordClosed().then(() => undefined);

  private stableHeight = 0;
  private crosswordReady = false;
  private viewReady = false;
  private readonly pagehideHandler = () => void this.crossword.trackCrosswordClosed();
  private readonly orientationHandler = () => this.updateViewportHeight(true);
  private readonly focusOutHandler = () => {
    window.setTimeout(() => this.updateViewportHeight(), 120);
  };
  private readonly viewportResizeHandler = () => this.updateViewportHeight();
  private readonly viewportScrollHandler = () => this.updateViewportHeight();
  private readonly resizeHandler = () => this.updateViewportHeight();

  constructor(protected readonly crossword: CrosswordService) {}

  async ngOnInit(): Promise<void> {
    this.bindVisualViewport();
    window.addEventListener('pagehide', this.pagehideHandler);
    await this.crossword.initializeCrossword();
    this.crosswordReady = true;
    this.focusInitialWordWhenReady();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.focusInitialWordWhenReady();
  }

  ngOnDestroy(): void {
    window.removeEventListener('pagehide', this.pagehideHandler);
    window.removeEventListener('orientationchange', this.orientationHandler);
    window.removeEventListener('focusout', this.focusOutHandler);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.viewportResizeHandler);
      window.visualViewport.removeEventListener('scroll', this.viewportScrollHandler);
    } else {
      window.removeEventListener('resize', this.resizeHandler);
    }

    document.body.classList.remove('keyboard-open', 'access-keyboard-open');
    document.documentElement.style.removeProperty('--keyboard-offset');
    document.documentElement.style.removeProperty('--app-viewport-height');
  }

  private bindVisualViewport(): void {
    this.stableHeight = window.visualViewport?.height || window.innerHeight;
    this.updateViewportHeight(true);
    window.addEventListener('orientationchange', this.orientationHandler);
    window.addEventListener('focusout', this.focusOutHandler);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.viewportResizeHandler);
      window.visualViewport.addEventListener('scroll', this.viewportScrollHandler);
    } else {
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  private focusInitialWordWhenReady(): void {
    if (!this.crosswordReady || !this.viewReady) {
      return;
    }

    requestAnimationFrame(() => this.crossword.focusInitialWord());
  }

  private updateViewportHeight(force = false): void {
    const visualViewport = window.visualViewport;
    const height = visualViewport?.height || window.innerHeight;
    const activeElement = document.activeElement as HTMLElement | null;
    const isGridInputFocused = activeElement?.classList.contains('cell-input') || false;
    const accessForm = document.getElementById('access-form');
    const isAccessInputFocused = accessForm?.contains(activeElement) || false;
    const keyboardLikelyOpen = isGridInputFocused && height < this.stableHeight * 0.82;
    const accessKeyboardLikelyOpen = isAccessInputFocused && height < this.stableHeight * 0.82;

    document.body.classList.toggle('keyboard-open', keyboardLikelyOpen);
    document.body.classList.toggle('access-keyboard-open', accessKeyboardLikelyOpen);

    if (keyboardLikelyOpen) {
      const offsetTop = visualViewport?.offsetTop || 0;
      const keyboardOffset = Math.max(0, this.stableHeight - height - offsetTop);
      document.documentElement.style.setProperty('--keyboard-offset', `${Math.round(keyboardOffset)}px`);
    } else {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    }

    if (!force && keyboardLikelyOpen) {
      return;
    }

    if (!force && accessKeyboardLikelyOpen) {
      document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
      return;
    }

    this.stableHeight = height;
    document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(this.stableHeight)}px`);
  }
}
