import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormStatus } from '../../../shared/form-status/form-status';
import { FormSubmission } from '../../../shared/form-submission/form-submission';

export interface Question {
  id: number;
  question: string;
  questionAuthor: string;
  isMyQuestion: boolean;
  createdAt: string;
  questionEditedAt: string | null;
  isAnswered: boolean;
  needsMyAnswer: boolean;
  answer: string | null;
  answerAuthor: string | null;
  isMyAnswer: boolean;
  answeredAt: string | null;
  answerEditedAt: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

// Una domanda può avere fino a 3 azioni proprie (rispondi, modifica domanda, modifica
// risposta), ma sono mutuamente esclusive nella UI di una singola card — un'unica
// FormSubmission per card basta. Fornita qui (non a livello di pagina) così ogni card ha
// il proprio stato submitting/status indipendente dalle altre in lista.
@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [FormsModule, FormStatus],
  providers: [FormSubmission],
  styleUrls: ['../../../../styles/pages/domande-question-card.css'],
  templateUrl: './question-card.html'
})
export class QuestionCard {
  @Input({ required: true }) question!: Question;
  @Output() readonly changed = new EventEmitter<Question>();

  protected readonly submission = inject(FormSubmission);

  protected readonly answering = signal(false);
  protected readonly editingQuestion = signal(false);
  protected readonly editingAnswer = signal(false);

  protected formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
  }

  protected async submitAnswer(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: `/api/questions/${this.question.id}/answer`,
      pendingMessage: 'Sto inviando la risposta...',
      successMessage: 'Risposta inviata.',
      afterSuccess: (result) => {
        this.changed.emit({
          ...this.question,
          answer: String(result['answer'] ?? ''),
          answerAuthor: String(result['answerAuthor'] ?? ''),
          answeredAt: String(result['answeredAt'] ?? ''),
          answerEditedAt: null,
          isAnswered: true,
          isMyAnswer: true,
          needsMyAnswer: false
        });
        this.answering.set(false);
      }
    });
  }

  protected async submitQuestionEdit(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: `/api/questions/${this.question.id}/edit`,
      pendingMessage: 'Sto salvando la domanda...',
      successMessage: 'Domanda aggiornata.',
      resetOnSuccess: false,
      afterSuccess: (result) => {
        this.changed.emit({
          ...this.question,
          question: String(result['question'] ?? ''),
          questionEditedAt: String(result['questionEditedAt'] ?? '')
        });
        this.editingQuestion.set(false);
      }
    });
  }

  protected async submitAnswerEdit(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: `/api/questions/${this.question.id}/answer-edit`,
      pendingMessage: 'Sto salvando la risposta...',
      successMessage: 'Risposta aggiornata.',
      resetOnSuccess: false,
      afterSuccess: (result) => {
        this.changed.emit({
          ...this.question,
          answer: String(result['answer'] ?? ''),
          answerEditedAt: String(result['answerEditedAt'] ?? '')
        });
        this.editingAnswer.set(false);
      }
    });
  }
}
