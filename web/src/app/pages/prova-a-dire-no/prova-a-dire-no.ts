import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { TelemetryService } from '../../core/telemetry.service';

// 10 comportamenti diversi, uno per domanda, mai ripetuto durante la partita (#f4: "ogni
// domanda deve avere un comportamento unico"). 'move'/'disappear'/'swap'/'grow' erano già
// nella prima versione; 'multiply'/'bubble'/'rain'/'shell'/'drama'/'error' arrivano dal
// playground (/tavolo-da-gioco/prova-a-dire-no/playground), rifiniti lì con Rory prima di
// essere portati qui.
type EvasiveBehavior = 'move' | 'disappear' | 'swap' | 'grow' | 'multiply' | 'bubble' | 'rain' | 'shell' | 'drama' | 'error';

interface EvasiveQuestion {
  id: string;
  kind: 'evasive';
  text: string;
  behavior: EvasiveBehavior;
}

// Non evasiva, niente "No" da scappare: due date vere, salvate nel Calendario del sito come
// eventi normali (stesso endpoint /api/calendar-events usato dalla pagina Calendario) —
// sostituisce le due domande "a scelta" con opzioni scherzose (feedback di Rory: qui la
// risposta dev'essere una data vera, non una battuta).
interface DatesQuestion {
  id: string;
  kind: 'dates';
  text: string;
}

type GameQuestion = EvasiveQuestion | DatesQuestion;

interface Point { left: string; top: string }

// 11 domande (#e10/#f4): 10 a cui non si può rispondere "no" (comportamento fisso per
// domanda, mai ripetuto) e 1 passaggio con due date vere — subito dopo aver detto "sì" al
// viaggio, non più in fondo come le vecchie 2 domande "a scelta" con opzioni scherzose
// (feedback di Rory: qui la risposta dev'essere una data vera, salvata nel Calendario).
const QUESTIONS: readonly GameQuestion[] = [
  { id: 'mi-ami', kind: 'evasive', text: 'Mi ami?', behavior: 'move' },
  { id: 'sei-mia', kind: 'evasive', text: 'Sei mia?', behavior: 'disappear' },
  { id: 'ti-manco', kind: 'evasive', text: 'Ti manco quando non ci sono?', behavior: 'swap' },
  { id: 'viaggio-insieme', kind: 'evasive', text: 'Vuoi fare un viaggio con me?', behavior: 'grow' },
  {
    id: 'date-viaggio-appuntamento',
    kind: 'dates',
    text: 'Sei pregata di comunicarmi la data di quando ci vedremo la prossima volta e quando faremo questo viaggio'
  },
  { id: 'altro-bacio', kind: 'evasive', text: 'Me lo dai un altro bacio?', behavior: 'multiply' },
  { id: 'altro-appuntamento', kind: 'evasive', text: 'Vuoi un altro appuntamento?', behavior: 'bubble' },
  { id: 'coccole', kind: 'evasive', text: 'Mi fai di nuovo le coccole?', behavior: 'rain' },
  { id: 'scappiamo-insieme', kind: 'evasive', text: 'Scappiamo insieme lontani da tutto?', behavior: 'shell' },
  { id: 'dormire-abbracciati', kind: 'evasive', text: 'Vuoi dormire di nuovo abbracciati tutta la notte?', behavior: 'drama' },
  { id: 'altri-ricordi', kind: 'evasive', text: 'Creiamo altri ricordi insieme?', behavior: 'error' }
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

// 'multiply': i "Sì" raddoppiano a ogni tentativo, sparsi su tutta la finestra, senza limite
// basso artificiale (rifinito nel playground dopo il feedback "occupare tutta la pagina").
const MULTIPLY_CAP = 400;

// 'rain': simulazione con gravità vera via requestAnimationFrame (rifinita nel playground
// dopo il feedback "non simula per niente la gravità" sulla prima versione a keyframe).
const RAIN_SPAWN_MS = 160;
const RAIN_MAX_SPAWNED = 160;
const RAIN_GRAVITY = 0.38;
const RAIN_BUCKET_WIDTH = 132;
const RAIN_PIECE_HALF_HEIGHT = 23;
const RAIN_PILE_STEP = 46;

// 'shell': distanza slot->slot nel gioco delle 3 carte (larghezza bottone, min-width 8.75rem
// = 140px, + il gap di .pand-answers, 1.5rem = 24px). Tenuta qui in sync a mano con la CSS.
const SHELL_CARD_STEP = 164;

interface RainDrop {
  id: number;
  x: number;
  y: number;
  vy: number;
  rot: number;
  vrot: number;
  settled: boolean;
}

@Component({
  selector: 'app-prova-a-dire-no',
  standalone: true,
  imports: [AppShell, RouterLink, EditorialText, FormsModule],
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
  // La pioggia deve accumularsi sotto la domanda, non sovrapporsi a lei: il palco normale
  // centra verticalmente il suo unico figlio, quindi qui la domanda va ancorata in alto
  // apposta (vedi .pand-stage-rain in CSS) — bug segnalato da Rory, i Sì si fermavano sopra
  // invece che sotto.
  protected readonly isRainQuestion = computed(
    () => this.currentQuestion()?.kind === 'evasive' && (this.currentQuestion() as EvasiveQuestion).behavior === 'rain'
  );

  protected readonly wrongAttempts = signal(0);
  protected readonly noButtonPosition = signal<Point | null>(null);
  protected readonly noButtonHidden = signal(false);
  protected readonly answersSwapped = signal(false);
  protected readonly swapPulse = signal(false);
  protected readonly yesGrowStep = signal(0);
  protected readonly yesFullscreen = computed(() => this.yesGrowStep() >= GROW_STEPS_TO_FULLSCREEN);
  protected readonly yesScale = computed(() => 1 + this.yesGrowStep() * GROW_SCALE_PER_STEP);
  protected readonly noScale = computed(() => Math.max(0, 1 - this.yesGrowStep() * SHRINK_PER_STEP));

  // multiply
  protected readonly yesPositions = signal<Point[]>([]);

  // bubble
  protected readonly bubblePopping = signal(false);
  protected readonly bubblePopped = signal(false);
  protected readonly poofOrigin = signal<Point | null>(null);
  protected readonly poofParticles = signal<{ id: number; dx: number; dy: number }[]>([]);

  // rain
  protected readonly rainActive = signal(false);
  protected readonly rainDrops = signal<RainDrop[]>([]);
  private rainSpawnTimer: ReturnType<typeof setInterval> | null = null;
  private rainRafId: number | null = null;
  private rainNextId = 0;
  private rainSpawnedCount = 0;
  private rainPileHeights: number[] = [];

  // shell — niente più vero flip 3D con facce separate (position:absolute, dimensioni
  // fisse): erano bottoni strutturalmente diversi dal resto della pagina (feedback di Rory,
  // "perché non sono uguali agli altri?"). Ora sono gli stessi .pand-no/.pand-yes di sempre,
  // il "giro" è solo il testo che cambia insieme al pulse già usato per 'swap'.
  protected readonly shellPhase = signal<'idle' | 'flipped' | 'shuffling' | 'waiting'>('idle');
  protected readonly shellLabels = signal<string[]>(['Sì', 'No', 'Sì']);
  protected readonly shellSlotOf = signal<number[]>([0, 1, 2]);
  protected readonly shellPicked = signal<number | null>(null);
  protected readonly shellFlipPulse = signal(false);
  protected readonly shellRevealPulse = signal<number | null>(null);

  // drama
  protected readonly dramaText = signal('No');
  protected readonly dramaLeaving = signal(false);
  private dramaStep = 0;
  private readonly dramaLines = [
    'Ehi, piano...',
    'Aspetta, che fretta c\'è?',
    'Ma... sul serio?',
    'Ma davvero mi hai premuto...?',
    'Non ci posso credere.',
    'Dai, non fare così.',
    'Smettila!',
    'Ok, adesso mi hai ferito.',
    'Stai proprio insistendo, eh?',
    'Continua pure, tanto non cambio idea.',
    'Sai che puoi solo dire Sì, vero?',
    'Mmh, comincio a offendermi sul serio.',
    'Ultimo avviso...',
    'Va bene, ho deciso: me ne vado.',
    'No, dico davvero.',
    'Sto per andarmene, guarda.',
    'Questo è il momento in cui me ne vado.',
    'Va bene, mi sono offeso sul serio. Ciao! 😤'
  ];

  // error
  protected readonly fakeAlertOpen = signal(false);

  // dates — due date vere (non nel Calendario del Mondo Bianco: solo loggate come risposta,
  // stesso schema di tutte le altre domande) invece delle vecchie 2 domande "a scelta" con
  // opzioni scherzose.
  protected readonly nextMeetingDate = signal('');
  protected readonly tripDate = signal('');

  private lastDodgeAt = 0;

  private dodgeBehavior(): EvasiveBehavior | null {
    const question = this.currentQuestion();
    return question?.kind === 'evasive' ? question.behavior : null;
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
    if (!question || question.kind !== 'evasive') return; // 'dates': niente "No" da scappare

    switch (question.behavior) {
      case 'swap':
        this.wrongAttempts.update((n) => n + 1);
        this.answersSwapped.update((v) => !v);
        // Ritocca la classe che fa scattare l'animazione di rimbalzo: se non si resetta
        // prima, un secondo scambio rapido non la farebbe ripartire.
        this.swapPulse.set(false);
        requestAnimationFrame(() => this.swapPulse.set(true));
        return;

      case 'grow':
        this.wrongAttempts.update((n) => n + 1);
        this.yesGrowStep.update((n) => Math.min(n + 1, GROW_STEPS_TO_FULLSCREEN));
        return;

      case 'disappear':
        this.wrongAttempts.update((n) => n + 1);
        this.noButtonHidden.set(true);
        setTimeout(() => {
          // Ricompare altrove, non sotto lo stesso dito/cursore.
          this.noButtonPosition.set(this.randomPosition());
          this.noButtonHidden.set(false);
        }, 500 + Math.random() * 500);
        return;

      case 'multiply':
        this.wrongAttempts.update((n) => n + 1);
        this.yesPositions.update((positions) => {
          if (positions.length >= MULTIPLY_CAP) return positions;
          const base = positions.length === 0 ? 1 : positions.length;
          const doubled = new Array(Math.min(base * 2, MULTIPLY_CAP)).fill(null);
          return doubled.map(() => this.windowRandomPosition());
        });
        this.noButtonPosition.set(this.windowRandomPosition());
        return;

      case 'bubble':
        this.wrongAttempts.update((n) => n + 1);
        if (!this.bubblePopped()) this.popBubble();
        return;

      case 'rain':
        this.wrongAttempts.update((n) => n + 1);
        this.rainActive.set(true);
        this.startRain();
        return;

      case 'shell':
        this.playShellGame();
        return;

      case 'drama':
        this.advanceDrama();
        return;

      case 'error':
        this.wrongAttempts.update((n) => n + 1);
        this.fakeAlertOpen.set(true);
        return;

      default:
        // 'move' da touch (niente hover): dodge diretto al tocco, il mousemove sopra copre
        // il resto.
        this.wrongAttempts.update((n) => n + 1);
        this.noButtonPosition.set(this.randomPosition());
    }
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

  protected onDatesSubmit(): void {
    const question = this.currentQuestion();
    if (!question || question.kind !== 'dates') return;
    if (!this.nextMeetingDate() || !this.tripDate()) return; // bottone disabilitato finché mancano, difesa in più

    void this.telemetry.trackEvent('tavolo-da-gioco', 'prova_a_dire_no_answered', {
      questionId: question.id,
      kind: 'dates',
      nextMeetingDate: this.nextMeetingDate(),
      tripDate: this.tripDate()
    });
    this.advance();
  }

  protected restart(): void {
    this.currentIndex.set(0);
    this.resetEvasionState();
  }

  // --- bubble --------------------------------------------------------

  private popBubble(): void {
    const btn = this.noButtonRef()?.nativeElement;
    const rect = btn?.getBoundingClientRect();
    this.bubblePopping.set(true);
    const particles = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      dx: Math.cos((i / 10) * Math.PI * 2) * (30 + Math.random() * 40),
      dy: Math.sin((i / 10) * Math.PI * 2) * (30 + Math.random() * 40)
    }));
    if (rect) {
      this.poofOrigin.set({ left: `${rect.left + rect.width / 2}px`, top: `${rect.top + rect.height / 2}px` });
    }
    this.poofParticles.set(particles);
    setTimeout(() => {
      this.bubblePopping.set(false);
      this.bubblePopped.set(true);
    }, 320);
  }

  // --- rain --------------------------------------------------------

  private startRain(): void {
    if (this.rainSpawnTimer) return;
    this.rainSpawnTimer = setInterval(() => {
      if (this.rainSpawnedCount >= RAIN_MAX_SPAWNED) {
        if (this.rainSpawnTimer) clearInterval(this.rainSpawnTimer);
        this.rainSpawnTimer = null;
        return;
      }
      this.rainSpawnedCount++;
      const width = this.stageRef()?.nativeElement.clientWidth ?? 500;
      this.rainDrops.update((drops) => [
        ...drops,
        {
          id: this.rainNextId++,
          x: 20 + Math.random() * Math.max(40, width - 40),
          y: -20,
          vy: 1 + Math.random() * 1.5,
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 10,
          settled: false
        }
      ]);
    }, RAIN_SPAWN_MS);

    const step = () => {
      const stage = this.stageRef()?.nativeElement;
      const height = stage?.clientHeight ?? 400;
      const width = stage?.clientWidth ?? 500;
      const bucketCount = Math.ceil(width / RAIN_BUCKET_WIDTH) + 1;
      if (this.rainPileHeights.length !== bucketCount) {
        this.rainPileHeights = new Array(bucketCount).fill(0);
      }

      let changed = false;
      const next = this.rainDrops().map((drop) => {
        if (drop.settled) return drop;
        changed = true;
        const bucket = Math.min(bucketCount - 1, Math.max(0, Math.round(drop.x / RAIN_BUCKET_WIDTH)));
        const floorY = height - RAIN_PIECE_HALF_HEIGHT - this.rainPileHeights[bucket];
        const nextY = drop.y + drop.vy;
        if (nextY >= floorY) {
          // Si posa con un piccolo scarto casuale, non allineato al pixel: pila "alla
          // rinfusa", non colonne perfette.
          this.rainPileHeights[bucket] += RAIN_PILE_STEP + Math.random() * 10;
          return { ...drop, y: floorY, settled: true, rot: drop.rot + (Math.random() - 0.5) * 40 };
        }
        return { ...drop, y: nextY, vy: drop.vy + RAIN_GRAVITY, rot: drop.rot + drop.vrot };
      });
      if (changed) this.rainDrops.set(next);

      if (this.currentQuestion()?.kind === 'evasive' && (this.currentQuestion() as EvasiveQuestion).behavior === 'rain') {
        this.rainRafId = requestAnimationFrame(step);
      }
    };
    this.rainRafId = requestAnimationFrame(step);
  }

  // --- shell --------------------------------------------------------

  protected shellOffsetFor(cardIndex: number): number {
    const slot = this.shellSlotOf().indexOf(cardIndex);
    return (slot - cardIndex) * SHELL_CARD_STEP;
  }

  // Coperta (mostra "?" invece dell'etichetta vera) durante flip/mescolamento sempre, e in
  // "waiting" finché non è quella scelta.
  protected isShellCardCovered(cardIndex: number): boolean {
    const phase = this.shellPhase();
    if (phase === 'flipped' || phase === 'shuffling') return true;
    if (phase === 'waiting') return this.shellPicked() !== cardIndex;
    return false;
  }

  protected shellCardText(cardIndex: number): string {
    return this.isShellCardCovered(cardIndex) ? '?' : this.shellLabels()[cardIndex];
  }

  // Prima del trucco: cliccare direttamente una "Sì" risponde subito, senza far partire
  // comunque l'animazione — solo la carta che dice davvero "No" fa scattare mescola. Dopo il
  // mescolamento (fase "waiting"): le carte restano coperte. Il primo click su una carta
  // coperta la "gira" e basta (per farla vedere) — non risponde ancora e le altre due
  // restano coperte e non cliccabili; serve un secondo click, proprio su quella già
  // scoperta, per confermarla come risposta.
  protected onShellCardClick(cardIndex: number): void {
    if (this.shellPhase() === 'waiting') {
      if (this.shellPicked() === null) {
        this.shellPicked.set(cardIndex);
        this.pulseShellCard(cardIndex);
        return;
      }
      if (this.shellPicked() === cardIndex) {
        this.onYesClick();
      }
      return;
    }

    if (this.shellPhase() !== 'idle') return; // in animazione: ignora click extra

    if (this.shellLabels()[cardIndex] === 'Sì') {
      this.onYesClick();
      return;
    }
    this.wrongAttempts.update((n) => n + 1);
    this.playShellGame();
  }

  // Stesso pulse già usato per 'swap' (pand-pulse/is-pulsing): non un'animazione nuova da
  // mantenere solo per queste carte.
  private pulseShellCard(cardIndex: number | 'all'): void {
    if (cardIndex === 'all') {
      this.shellFlipPulse.set(false);
      requestAnimationFrame(() => this.shellFlipPulse.set(true));
    } else {
      this.shellRevealPulse.set(null);
      requestAnimationFrame(() => this.shellRevealPulse.set(cardIndex));
    }
  }

  private playShellGame(): void {
    if (this.shellPhase() !== 'idle') return;
    this.shellPhase.set('flipped');
    this.pulseShellCard('all');
    setTimeout(() => {
      this.shellPhase.set('shuffling');
      let shuffles = 0;
      const shuffleStep = setInterval(() => {
        this.shellSlotOf.update((slots) => {
          const copy = [...slots];
          const i = Math.floor(Math.random() * copy.length);
          let j = Math.floor(Math.random() * copy.length);
          if (j === i) j = (j + 1) % copy.length;
          [copy[i], copy[j]] = [copy[j], copy[i]];
          return copy;
        });
        shuffles++;
        if (shuffles >= 5) {
          clearInterval(shuffleStep);
          this.shellLabels.set(['Sì', 'Sì', 'Sì']);
          // Restano coperte: "waiting", non rivelate automaticamente — si scoprono solo al
          // click dell'utente, una alla volta (vedi onShellCardClick).
          this.shellPhase.set('waiting');
        }
      }, 320);
    }, 500);
  }

  // --- drama --------------------------------------------------------

  private advanceDrama(): void {
    if (this.dramaLeaving()) return;

    if (this.dramaStep >= this.dramaLines.length) {
      // La riga di addio è già a schermo da una pressione precedente: questa in più è
      // quella che lo fa volare via per davvero, non un timer automatico.
      this.wrongAttempts.update((n) => n + 1);
      this.dramaLeaving.set(true);
      this.noButtonPosition.set({ left: `${window.innerWidth + 200}px`, top: '30%' });
      return;
    }

    this.wrongAttempts.update((n) => n + 1);
    this.dramaText.set(this.dramaLines[this.dramaStep]);
    this.dramaStep++;
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

    this.yesPositions.set([]);

    this.bubblePopping.set(false);
    this.bubblePopped.set(false);
    this.poofOrigin.set(null);
    this.poofParticles.set([]);

    this.rainActive.set(false);
    this.rainDrops.set([]);
    this.rainSpawnedCount = 0;
    this.rainPileHeights = [];
    if (this.rainSpawnTimer) {
      clearInterval(this.rainSpawnTimer);
      this.rainSpawnTimer = null;
    }
    if (this.rainRafId !== null) {
      cancelAnimationFrame(this.rainRafId);
      this.rainRafId = null;
    }

    this.shellPhase.set('idle');
    this.shellLabels.set(['Sì', 'No', 'Sì']);
    this.shellSlotOf.set([0, 1, 2]);
    this.shellPicked.set(null);
    this.shellFlipPulse.set(false);
    this.shellRevealPulse.set(null);

    this.dramaStep = 0;
    this.dramaText.set('No');
    this.dramaLeaving.set(false);

    this.fakeAlertOpen.set(false);

    this.nextMeetingDate.set('');
    this.tripDate.set('');
  }

  protected closeFakeAlert(): void {
    this.fakeAlertOpen.set(false);
    this.onYesClick();
  }

  private randomPosition(): Point {
    // Sotto il palco vero (titolo + intro + puntini), non sotto un numero fisso: se l'intro
    // cambia lunghezza da CMS, il margine di sicurezza si aggiorna da solo invece di
    // ritrovarsi il "No" sovrapposto al testo.
    const stageTop = this.stageRef()?.nativeElement.getBoundingClientRect().top ?? SAFE_TOP;
    const safeTop = Math.max(SAFE_TOP, stageTop + 12);
    const maxLeft = Math.max(SAFE_SIDE, window.innerWidth - BUTTON_WIDTH - SAFE_SIDE);
    const maxTop = Math.max(safeTop, window.innerHeight - BUTTON_HEIGHT - SAFE_BOTTOM);
    const left = SAFE_SIDE + Math.random() * (maxLeft - SAFE_SIDE);
    const top = safeTop + Math.random() * (maxTop - safeTop);
    return { left: `${left}px`, top: `${top}px` };
  }

  private windowRandomPosition(): Point {
    const left = 20 + Math.random() * (window.innerWidth - 140);
    const top = 120 + Math.random() * (window.innerHeight - 220);
    return { left: `${left}px`, top: `${top}px` };
  }
}
