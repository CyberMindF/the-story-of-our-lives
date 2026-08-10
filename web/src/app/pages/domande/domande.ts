import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { ContentMessage } from '../../shared/content-message/content-message';
import { Question, QuestionCard } from './question-card/question-card';

// Stesso scheletro di Lettere: fetch diretto nel componente, nessun service dedicato,
// FormData+FormSubmission per il form in cima. Ogni domanda in lista gestisce le proprie
// azioni (rispondi/modifica) in un componente figlio a sé, vedi question-card.ts.
@Component({
  selector: 'app-domande',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, ContentMessage, QuestionCard],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/domande.css'],
  templateUrl: './domande.html'
})
export class Domande implements OnInit {
  protected readonly submission = inject(FormSubmission);

  protected readonly questions = signal<Question[]>([]);
  protected readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadQuestions();
  }

  protected async submitQuestion(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/questions',
      pendingMessage: 'Sto inviando la domanda...',
      successMessage: 'Domanda inviata.',
      afterSuccess: () => this.loadQuestions()
    });
  }

  protected onQuestionChanged(updated: Question): void {
    this.questions.update((list) => list.map((entry) => (entry.id === updated.id ? updated : entry)));
  }

  private async loadQuestions(): Promise<void> {
    try {
      const response = await fetch('/api/questions', { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { questions?: Question[] };
      this.questions.set(data.questions || []);
    } catch (error) {
      console.error('Errore nel caricamento delle domande:', error);
      this.loadError.set(true);
    }
  }
}
