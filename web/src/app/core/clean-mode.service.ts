import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// Query param condiviso da AppShell (nasconde header/back-link) e dalle pagine che vogliono
// nascondere anche i propri bottoni/form in lettura pulita (es. Lettere).
@Injectable({ providedIn: 'root' })
export class CleanModeService {
  private readonly route = inject(ActivatedRoute);
  readonly active = this.route.snapshot.queryParamMap.get('clean') === '1';
}
