import { Component } from '@angular/core';
import { CrosswordService } from '../crossword.service';

@Component({
  selector: 'app-crossword-toolbar',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: './crossword-toolbar.html'
})
export class CrosswordToolbar {
  constructor(protected readonly crossword: CrosswordService) {}
}
