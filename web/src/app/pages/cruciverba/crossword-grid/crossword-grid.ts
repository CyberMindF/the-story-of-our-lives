import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-grid',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    <div #gridScroll class="grid-scroll" [attr.aria-busy]="crossword.loading()">
      <div
        class="grid"
        role="group"
        aria-label="Griglia del cruciverba"
        [style.gridTemplateColumns]="'repeat(' + crossword.dimensions().cols + ', var(--cell-size))'"
        [style.gridTemplateRows]="'repeat(' + crossword.dimensions().rows + ', var(--cell-size))'"
      >
        @for (cell of crossword.cellsList(); track cell.key) {
          <div
            class="cell"
            [class.is-selected]="crossword.activeCellKeys().has(cell.key)"
            [class.is-active]="crossword.currentCellKey() === cell.key"
            [class.is-correct]="crossword.validationMarks()[cell.key] === 'correct'"
            [class.is-error]="crossword.validationMarks()[cell.key] === 'error'"
            [style.gridRow]="cell.row + crossword.dimensions().rowOffset"
            [style.gridColumn]="cell.col + crossword.dimensions().colOffset"
            [attr.data-cell-key]="cell.key"
          >
            @if (cell.startWordIds.length > 0) {
              <span class="cell-number" aria-hidden="true">{{ crossword.getCellMarkerText(cell) }}</span>
            }
            <input
              #cellInput
              class="cell-input"
              type="text"
              inputmode="text"
              maxlength="1"
              autocomplete="one-time-code"
              autocorrect="off"
              autocapitalize="characters"
              spellcheck="false"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              [value]="crossword.progress()[cell.key] || ''"
              [attr.data-cell-key]="cell.key"
              [attr.aria-label]="crossword.getCellAriaLabel(cell)"
              (focus)="crossword.handleCellFocus(cell.key)"
              (click)="crossword.handleCellClick(cell.key)"
              (keydown)="crossword.handleCellKeyDown($event, cell.key)"
              (keyup)="crossword.handleCellKeyUp($event, cell.key)"
              (beforeinput)="crossword.handleCellBeforeInput($event, cell.key)"
              (input)="crossword.handleCellInput($event, cell.key)"
              (paste)="crossword.handleCellPaste($event, cell.key)"
            />
          </div>
        }
      </div>
    </div>
  `
})
export class CrosswordGrid implements AfterViewInit {
  @ViewChild('gridScroll') private gridScrollRef?: ElementRef<HTMLElement>;
  @ViewChildren('cellInput') private cellInputRefs?: QueryList<ElementRef<HTMLInputElement>>;

  constructor(protected readonly crossword: CrosswordService) {}

  ngAfterViewInit(): void {
    this.registerElements();
    this.cellInputRefs?.changes.subscribe(() => this.registerCellInputs());
  }

  private registerElements(): void {
    this.crossword.registerGridScroll(this.gridScrollRef?.nativeElement ?? null);
    this.registerCellInputs();
  }

  private registerCellInputs(): void {
    const entries =
      this.cellInputRefs?.toArray().map((ref) => {
        const input = ref.nativeElement;
        return [input.dataset['cellKey'] || '', input] as const;
      }) ?? [];

    this.crossword.registerCellInputs(entries.filter(([cellKey]) => Boolean(cellKey)));
  }
}
