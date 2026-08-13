import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { TelemetryService } from '../../core/telemetry.service';

type EvasiveBehavior = 'move' | 'disappear' | 'morph';

interface EvasiveQuestion {
  id: string;
  kind: 'evasive';
  text: string;
  behavior: EvasiveBehavior;
}

interface ChoiceQuestion {
  id: string;
  kind: 'choice';
  text: string;
  options: string[];
}

type GameQuestion = EvasiveQuestion | ChoiceQuestion;

// 8 domande (#e10): 6 a cui non si può rispondere "no" (bottone che scappa/sparisce/diventa
// "Sì" a seconda della domanda, fisso per ciascuna su richiesta di Rory — non casuale a ogni
// apertura) e 2 "a scelta" dove ogni opzione è comunque una risposta valida, senza fuga.
const QUESTIONS: readonly GameQuestion[] = [
  { id: 'mi-ami', kind: 'evasive', text: 'Mi ami?', behavior: 'move' },
  { id: 'sei-mia', kind: 'evasive', text: 'Sei mia?', behavior: 'disappear' },
  { id: 'ti-manco', kind: 'evasive', text: 'Ti manco quando non ci sono?', behavior: 'morph' },
  { id: 'viaggio-insieme', kind: 'evasive', text: 'Vuoi fare un viaggio con me?', behavior: 'move' },
  { id: 'altro-appuntamento', kind: 'evasive', text: 'Vuoi un altro appuntamento?', behavior: 'disappear' },
  { id: 'preferita', kind: 'evasive', text: 'Sono il tuo preferito?', behavior: 'morph' },
  {
    id: 'quando-viaggio',
    kind: 'choice',
    text: 'Quando lo facciamo questo viaggio?',
    options: ['Appena possibile', 'Il prima possibile', 'Ieri, se potessi tornare indietro', 'Quando vuoi tu']
  },
  {
    id: 'prossimo-appuntamento',
    kind: 'choice',
    text: 'Quando ci vediamo la prossima volta?',
    options: ['Appena possibile', 'Domani, se dipendesse da me', 'Quando vuoi tu', 'Sempre troppo tardi per i miei gusti']
  }
];

// Margini di sicurezza per non far comparire il bottone "No" sotto l'header della shell o
// troppo vicino ai bordi — soprattutto da mobile, il caso esplicitamente segnalato da Rory.
const SAFE_TOP = 140;
const SAFE_BOTTOM = 120;
const SAFE_SIDE = 24;
const BUTTON_WIDTH = 140;
const BUTTON_HEIGHT = 56;

@Component({
  selector: 'app-prova-a-dire-no',
  standalone: true,
  imports: [AppShell, RouterLink],
  styleUrls: ['../../../styles/pages/prova-a-dire-no.css'],
  templateUrl: './prova-a-dire-no.html'
})
export class ProvaADireNo {
  private readonly telemetry = inject(TelemetryService);

  protected readonly questions = QUESTIONS;
  protected readonly currentIndex = signal(0);
  protected readonly finished = computed(() => this.currentIndex() >= this.questions.length);
  protected readonly currentQuestion = computed<GameQuestion | null>(() =>
    this.finished() ? null : this.questions[this.currentIndex()]
  );

  protected readonly wrongAttempts = signal(0);
  protected readonly noButtonPosition = signal<{ left: string; top: string } | null>(null);
  protected readonly noButtonHidden = signal(false);
  protected readonly noButtonMorphed = signal(false);

  protected onNoInteract(): void {
    const question = this.currentQuestion();
    if (!question || question.kind !== 'evasive') return;

    if (question.behavior === 'morph') {
      // Un solo tocco: il pointerdown lo trasforma subito in "Sì", e lo stesso click che
      // segue lo conferma come risposta corretta — nessun secondo tentativo richiesto.
      if (!this.noButtonMorphed()) {
        this.wrongAttempts.update((n) => n + 1);
        this.noButtonMorphed.set(true);
      }
      return;
    }

    this.wrongAttempts.update((n) => n + 1);

    if (question.behavior === 'disappear') {
      this.noButtonHidden.set(true);
      const delay = 500 + Math.random() * 500;
      setTimeout(() => {
        // Ricompare altrove, non sotto lo stesso dito/cursore.
        this.noButtonPosition.set(this.randomPosition());
        this.noButtonHidden.set(false);
      }, delay);
      return;
    }

    // 'move'
    this.noButtonPosition.set(this.randomPosition());
  }

  protected onNoClick(event: Event): void {
    const question = this.currentQuestion();
    if (question?.kind === 'evasive' && question.behavior === 'morph' && this.noButtonMorphed()) {
      this.answer(question.id, this.wrongAttempts());
      return;
    }
    // Per 'move'/'disappear' il click non dovrebbe mai arrivare qui (il bottone si è già
    // spostato/nascosto al pointerdown): se succede comunque, non conta come risposta.
    event.preventDefault();
  }

  protected onYesClick(): void {
    const question = this.currentQuestion();
    if (!question) return;
    this.answer(question.id, this.wrongAttempts());
  }

  protected onChoiceClick(optionIndex: number): void {
    const question = this.currentQuestion();
    if (!question || question.kind !== 'choice') return;
    void this.telemetry.trackEvent('tavolo-da-gioco', 'prova_a_dire_no_answered', {
      questionId: question.id,
      kind: 'choice',
      optionIndex
    });
    this.advance();
  }

  protected restart(): void {
    this.currentIndex.set(0);
    this.resetEvasionState();
  }

  private answer(questionId: string, attempts: number): void {
    void this.telemetry.trackEvent('tavolo-da-gioco', 'prova_a_dire_no_answered', {
      questionId,
      kind: 'evasive',
      wrongAttempts: attempts
    });
    this.advance();
  }

  private advance(): void {
    this.currentIndex.update((index) => index + 1);
    this.resetEvasionState();
  }

  private resetEvasionState(): void {
    this.wrongAttempts.set(0);
    this.noButtonPosition.set(null);
    this.noButtonHidden.set(false);
    this.noButtonMorphed.set(false);
  }

  private randomPosition(): { left: string; top: string } {
    const maxLeft = Math.max(SAFE_SIDE, window.innerWidth - BUTTON_WIDTH - SAFE_SIDE);
    const maxTop = Math.max(SAFE_TOP, window.innerHeight - BUTTON_HEIGHT - SAFE_BOTTOM);
    const left = SAFE_SIDE + Math.random() * (maxLeft - SAFE_SIDE);
    const top = SAFE_TOP + Math.random() * (maxTop - SAFE_TOP);
    return { left: `${left}px`, top: `${top}px` };
  }
}
