import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-grid',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './crossword-grid.html'
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
