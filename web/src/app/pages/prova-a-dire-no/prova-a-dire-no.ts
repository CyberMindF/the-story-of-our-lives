import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { TelemetryService } from '../../core/telemetry.service';

// 'move' non è più solo "salta altrove al click": da mousemove continuo (vedi
// onStageMouseMove) scappa già mentre il cursore si avvicina, come i veri "runaway button" —
// il click/tap resta comunque un fallback per chi arriva dritto (o da touch, dove non c'è
// hover). 'swap' sostituisce il vecchio 'morph': invece di cambiare etichetta (confuso col
// tocco singolo, feedback di Rory), scambia le posizioni dei due bottoni. 'grow' non fa più
// crescere solo il "Sì": il "No" si restringe in tandem, così i due bottoni raccontano la
// stessa storia invece di uno statico e uno che si gonfia.
type EvasiveBehavior = 'move' | 'disappear' | 'swap' | 'grow';

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
  // L'unica opzione "negativa" della lista (feedback di Rory: senza, sembrava che qui non si
  // potesse nemmeno provare a dire no) — scappa col trucco 'move', le altre restano scelte
  // libere e valide.
  evasiveOptionIndex: number;
}

type GameQuestion = EvasiveQuestion | ChoiceQuestion;

// 8 domande (#e10): 6 a cui non si può rispondere "no" (comportamento fisso per domanda, non
// casuale a ogni apertura) e 2 "a scelta" dove un'opzione (quella negativa) scappa come il
// "No" delle altre, le rimanenti sono scelte libere e valide.
const QUESTIONS: readonly GameQuestion[] = [
  { id: 'mi-ami', kind: 'evasive', text: 'Mi ami?', behavior: 'move' },
  { id: 'sei-mia', kind: 'evasive', text: 'Sei mia?', behavior: 'disappear' },
  { id: 'ti-manco', kind: 'evasive', text: 'Ti manco quando non ci sono?', behavior: 'swap' },
  { id: 'viaggio-insieme', kind: 'evasive', text: 'Vuoi fare un viaggio con me?', behavior: 'grow' },
  { id: 'altro-appuntamento', kind: 'evasive', text: 'Vuoi un altro appuntamento?', behavior: 'disappear' },
  { id: 'preferita', kind: 'evasive', text: 'Sono il tuo preferito?', behavior: 'move' },
  {
    id: 'quando-viaggio',
    kind: 'choice',
    text: 'Quando lo facciamo questo viaggio?',
    options: ['Appena possibile', 'Il prima possibile', 'Quando vuoi tu', 'Mai, veramente mai'],
    evasiveOptionIndex: 3
  },
  {
    id: 'prossimo-appuntamento',
    kind: 'choice',
    text: 'Quando ci vediamo la prossima volta?',
    options: ['Appena possibile', 'Domani, se dipendesse da me', 'Quando vuoi tu', 'Non lo so, forse mai'],
    evasiveOptionIndex: 3
  }
];

// Margini di sicurezza per non far comparire il bottone "No" sotto l'header/titolo/intro o
// troppo vicino ai bordi — soprattutto da mobile, il caso esplicitamente segnalato da Rory.
// SAFE_TOP è solo il minimo assoluto: randomPosition() preferisce partire da sotto il palco
// vero e proprio (vedi stageRef), che si sposta da solo se l'intro cambia lunghezza da CMS.
const SAFE_TOP = 140;
const SAFE_BOTTOM = 120;
const SAFE_SIDE = 24;
const BUTTON_WIDTH = 140;
const BUTTON_HEIGHT = 56;

// Raggio entro cui il cursore fa scattare la fuga (px) e tempo minimo tra due scatti, per non
// farlo vibrare a ogni pixel di movimento del mouse.
const DODGE_RADIUS = 110;
const DODGE_COOLDOWN_MS = 400;

// 'grow': ogni tentativo di dire "no" fa crescere il "Sì" e restringere il "No" di un altro
// passo, finché il primo non copre tutto lo schermo e il secondo non è più raggiungibile.
const GROW_STEPS_TO_FULLSCREEN = 5;
const GROW_SCALE_PER_STEP = 0.55;
const SHRINK_PER_STEP = 0.18;

@Component({
  selector: 'app-prova-a-dire-no',
  standalone: true,
  imports: [AppShell, RouterLink, EditorialText],
  styleUrls: ['../../../styles/pages/prova-a-dire-no.css'],
  templateUrl: './prova-a-dire-no.html'
})
export class ProvaADireNo {
  private readonly telemetry = inject(TelemetryService);
  private readonly noButtonRef = viewChild<ElementRef<HTMLButtonElement>>('noBtn');
  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');

  protected readonly questions = QUESTIONS;
  protected readonly currentIndex = signal(0);
  protected readonly finished = computed(() => this.currentIndex() >= this.questions.length);
  protected readonly currentQuestion = computed<GameQuestion | null>(() =>
    this.finished() ? null : this.questions[this.currentIndex()]
  );

  protected readonly wrongAttempts = signal(0);
  protected readonly noButtonPosition = signal<{ left: string; top: string } | null>(null);
  protected readonly noButtonHidden = signal(false);
  protected readonly answersSwapped = signal(false);
  protected readonly swapPulse = signal(false);
  protected readonly yesGrowStep = signal(0);
  protected readonly yesFullscreen = computed(() => this.yesGrowStep() >= GROW_STEPS_TO_FULLSCREEN);
  protected readonly yesScale = computed(() => 1 + this.yesGrowStep() * GROW_SCALE_PER_STEP);
  protected readonly noScale = computed(() => Math.max(0, 1 - this.yesGrowStep() * SHRINK_PER_STEP));

  private lastDodgeAt = 0;

  // L'opzione negativa delle domande "a scelta" scappa esattamente come il "No" con
  // comportamento 'move' — stesso trucco, non una variante nuova da mantenere a parte.
  private dodgeBehavior(): EvasiveBehavior | null {
    const question = this.currentQuestion();
    if (!question) return null;
    return question.kind === 'evasive' ? question.behavior : 'move';
  }

  // Fuga "viva": scatta già mentre il cursore si avvicina, non solo al click. Solo da mouse
  // (da touch non esiste hover, resta il pointerdown qui sotto). Legato all'intero palco, non
  // al bottone stesso, perché una volta scattato altrove serve continuare a inseguirlo.
  protected onStageMouseMove(event: MouseEvent): void {
    if (this.dodgeBehavior() !== 'move' || this.noButtonHidden()) return;

    const button = this.noButtonRef()?.nativeElement;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    if (distance > DODGE_RADIUS) return;

    const now = Date.now();
    if (now - this.lastDodgeAt < DODGE_COOLDOWN_MS) return;
    this.lastDodgeAt = now;

    this.wrongAttempts.update((n) => n + 1);
    this.noButtonPosition.set(this.randomPosition());
  }

  protected onNoInteract(): void {
    const question = this.currentQuestion();
    if (!question) return;

    if (question.kind === 'choice') {
      // L'opzione negativa non "risponde" mai: scappa e basta, come il "No" a comportamento
      // 'move'. Le altre opzioni restano scelte libere gestite da onChoiceClick.
      this.wrongAttempts.update((n) => n + 1);
      this.noButtonPosition.set(this.randomPosition());
      return;
    }

    if (question.behavior === 'swap') {
      this.wrongAttempts.update((n) => n + 1);
      this.answersSwapped.update((v) => !v);
      // Ritocca la classe che fa scattare l'animazione di rimbalzo: se non si resetta prima,
      // un secondo scambio rapido non la farebbe ripartire.
      this.swapPulse.set(false);
      requestAnimationFrame(() => this.swapPulse.set(true));
      return;
    }

    if (question.behavior === 'grow') {
      this.wrongAttempts.update((n) => n + 1);
      this.yesGrowStep.update((n) => Math.min(n + 1, GROW_STEPS_TO_FULLSCREEN));
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

    // 'move' da touch (niente hover): dodge diretto al tocco, il mousemove sopra copre il resto.
    this.noButtonPosition.set(this.randomPosition());
  }

  protected onNoClick(event: Event): void {
    // Il click non dovrebbe mai arrivare qui: per 'move'/'disappear' il bottone si è già
    // spostato/nascosto al pointerdown, per 'grow' è troppo piccolo (o coperto) per essere
    // centrato, per 'swap' quella posizione ora è occupata dal "Sì". Se succede comunque
    // (es. click senza pointerdown precedente), non conta come risposta.
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
    this.answersSwapped.set(false);
    this.swapPulse.set(false);
    this.yesGrowStep.set(0);
    this.lastDodgeAt = 0;
  }

  private randomPosition(): { left: string; top: string } {
    // Sotto il palco vero (titolo + intro + puntini), non sotto un numero fisso: se l'intro
    // cambia lunghezza da CMS, il margine di sicurezza si aggiorna da solo invece di
    // ritrovarsi il "No" sovrapposto al testo (successo con l'intro appena aggiunta).
    const stageTop = this.stageRef()?.nativeElement.getBoundingClientRect().top ?? SAFE_TOP;
    const safeTop = Math.max(SAFE_TOP, stageTop + 12);
    const maxLeft = Math.max(SAFE_SIDE, window.innerWidth - BUTTON_WIDTH - SAFE_SIDE);
    const maxTop = Math.max(safeTop, window.innerHeight - BUTTON_HEIGHT - SAFE_BOTTOM);
    const left = SAFE_SIDE + Math.random() * (maxLeft - SAFE_SIDE);
    const top = safeTop + Math.random() * (maxTop - safeTop);
    return { left: `${left}px`, top: `${top}px` };
  }
}
