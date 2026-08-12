import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { AppSelect, AppSelectOption } from '../../shared/app-select/app-select';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

// Porting fedele di assets/js/suggestions/main.js: stesso endpoint, stesso invio come
// FormData (non JSON, a differenza degli altri servizi già portati), stessi messaggi.
@Component({
  selector: 'app-suggerimenti',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, AppSelect, EditorialText],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/suggerimenti.css'],
  templateUrl: './suggerimenti.html'
})
export class Suggerimenti {
  protected readonly submission = inject(FormSubmission);
  private readonly route = inject(ActivatedRoute);
  protected readonly categoryOptions: readonly AppSelectOption[] = [
    { value: 'calendario', label: '📅 Il Calendario' },
    { value: 'mappa', label: '🗺️ La Mappa dei Sogni' },
    { value: 'storie', label: '📖 Le Storie' },
    { value: 'cuffiette', label: '🎧 Le Cuffiette' },
    { value: 'bacheca', label: '📌 La Bacheca dei Ricordi' },
    { value: 'ponti', label: '🌈 I Ponti' },
    { value: 'lettere', label: '💌 Le Lettere' },
    { value: 'tavolo-da-gioco', label: '🎲 Il Tavolo da Gioco' },
    { value: 'cose-da-fare-insieme', label: "📔 L'Agenda delle Idee" },
    { value: 'ricettario', label: '🍳 Il Ricettario' },
    { value: 'altro', label: '✨ Qualcos’altro / tutto il sito' }
  ];
  protected readonly initialCategory = this.resolveInitialCategory();

  protected async submit(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/suggestions',
      pendingMessage: 'Sto conservando il tuo suggerimento...',
      successMessage: (result) => `Suggerimento ricevuto. Grazie, ${String(result['author'] || '')}.`
    });
  }

  private resolveInitialCategory(): string {
    const requested = this.route.snapshot.queryParamMap.get('category') || '';
    return this.categoryOptions.some((option) => option.value === requested) ? requested : '';
  }
}
