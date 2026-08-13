import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

export interface EffectProposal {
  id: string;
  num: number;
  name: string;
  emoji: string;
  description: string;
}

// Selezione di Rory dopo il primo giro di prova sulle 35 proposte (#f4): solo queste 9,
// alcune riprese pari pari, altre nuove (non erano tra le 35 originali) o riviste per
// calzare esattamente quello che ha descritto. Le altre 26 sono state tolte dal playground.
export const PROPOSALS: readonly EffectProposal[] = [
  {
    id: 'yes-multiply',
    num: 1,
    name: 'Il Sì che si Moltiplica',
    emoji: '👯',
    description: 'Ogni volta che provi a premere No, i bottoni Sì raddoppiano di numero, sparsi per tutta la pagina, senza limite.'
  },
  {
    id: 'bubble',
    num: 2,
    name: 'Bolla di Sapone',
    emoji: '🫧',
    description: 'Il No si gonfia come una bolla di sapone e scoppia in mille particelle — per sempre, non ricompare.'
  },
  {
    id: 'yes-rain',
    num: 3,
    name: 'Pioggia di Sì',
    emoji: '🌧️',
    description: 'Il No sparisce e inizia una pioggia infinita di Sì che cadono con gravità vera e si accatastano alla rinfusa in basso.'
  },
  {
    id: 'shell-game',
    num: 4,
    name: 'Il Gioco delle Tre Carte',
    emoji: '🃏',
    description: 'Tre carte "Sì, Sì, No" si girano mostrando il retro vuoto, si mescolano scivolando, e quando si scoprono sono diventate tutte Sì.'
  },
  {
    id: 'drama-queen',
    num: 5,
    name: 'Il Bottone Permaloso',
    emoji: '🎭',
    description: 'Ogni tentativo di premere No lo fa risentire sempre di più (tante frasi diverse), finché non si offende e vola via.'
  },
  {
    id: 'fake-error',
    num: 6,
    name: 'Falso Errore di Sistema',
    emoji: '⚠️',
    description: 'Premendo No appare un errore finto: bisogna premere Sì per continuare.'
  }
];

const YES_MULTIPLY_CAP = 400;
const RAIN_SPAWN_MS = 160;
const RAIN_MAX_SPAWNED = 160;
const RAIN_GRAVITY = 0.38;
// Bottoni Sì veri e della taglia classica (min-width 8rem = 128px), non più chip piccoli:
// il bucket di collisione e l'incremento della pila seguono quella taglia, altrimenti si
// sovrappongono invece di accumularsi (feedback di Rory: vanno fatti grandi come i tasti
// normali "così si accumulano prima").
const RAIN_BUCKET_WIDTH = 132;
const RAIN_PIECE_HALF_HEIGHT = 23;
const RAIN_PILE_STEP = 46;
// Distanza slot->slot nel gioco delle 3 carte: larghezza carta (6rem = 96px con radice 16px)
// più il gap dichiarato in CSS (.shell-answers, 1.25rem = 20px). Tenuto qui in sync a mano.
const SHELL_CARD_STEP = 116;

interface Point { left: string; top: string }

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
  selector: 'app-prova-a-dire-no-playground',
  standalone: true,
  imports: [AppShell, RouterLink],
  styleUrls: ['../../../styles/pages/prova-a-dire-no-playground.css'],
  templateUrl: './prova-a-dire-no-playground.html'
})
export class ProvaADireNoPlayground {
  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('pgStage');
  private readonly noBtnRef = viewChild<ElementRef<HTMLButtonElement>>('pgNoBtn');

  protected readonly proposals = PROPOSALS;
  protected readonly selectedProposalId = signal<string>(PROPOSALS[0].id);
  protected readonly selectedIndex = computed(() => this.proposals.findIndex((p) => p.id === this.selectedProposalId()));
  protected readonly activeProposal = computed<EffectProposal>(
    () => this.proposals.find((p) => p.id === this.selectedProposalId()) ?? this.proposals[0]
  );

  protected readonly attemptCount = signal(0);
  protected readonly yesClicked = signal(false);
  protected readonly testQuestion = signal('Vuoi fare una prova con me?');

  // 1. yes-multiply — posizioni sparse su tutta la finestra (viewport), non solo sul palco:
  // "occupare tutta la pagina" (feedback di Rory), niente limite basso artificiale.
  protected readonly yesPositions = signal<Point[]>([]);
  protected readonly noPos = signal<Point | null>(null);

  // 2. bubble — niente respawn dopo il pop (feedback: "non deve ricomparire").
  protected readonly bubblePopping = signal(false);
  protected readonly bubblePopped = signal(false);
  protected readonly poofParticles = signal<{ id: number; dx: number; dy: number }[]>([]);

  // 3. yes-rain — simulazione con gravità vera via requestAnimationFrame, non un
  // keyframe con target fisso: "non simula per niente la gravità" (feedback).
  protected readonly noHiddenForRain = signal(false);
  protected readonly rainDrops = signal<RainDrop[]>([]);
  private rainSpawnTimer: ReturnType<typeof setInterval> | null = null;
  private rainRafId: number | null = null;
  private rainNextId = 0;
  private rainSpawnedCount = 0;
  private rainPileHeights: number[] = [];

  // 4. shell-game — traduzione slot -> spostamento reale in px (translateX), non la
  // proprietà CSS "order" (non animabile: "le carte non si mescolano" era per questo).
  // Dopo il mescolamento le carte restano coperte ("waiting"): non si rivelano da sole
  // (feedback di Rory) — solo la carta che clicchi si gira, le altre restano coperte per
  // sempre e la scelta è quella, niente ripensamenti.
  protected readonly shellPhase = signal<'idle' | 'flipped' | 'shuffling' | 'waiting'>('idle');
  protected readonly shellLabels = signal<string[]>(['Sì', 'Sì', 'No']);
  protected readonly shellSlotOf = signal<number[]>([0, 1, 2]);
  protected readonly shellPicked = signal<number | null>(null);

  // 7. drama-queen — molte più frasi (non solo le 3 di esempio date da Rory). L'ultima riga
  // ("Ciao!") resta visibile finché non si preme un'ultima volta: solo quella pressione in
  // più fa volare via il bottone per davvero (feedback di Rory), non un timer automatico.
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

  // 7. fake-error
  protected readonly fakeAlertOpen = signal(false);

  // Origine (posizione reale del bottone al momento del pop) delle particelle della bolla.
  protected readonly poofOrigin = signal<Point | null>(null);

  constructor() {
    this.resetEffectState();
  }

  protected selectProposal(id: string): void {
    this.selectedProposalId.set(id);
    this.resetEffectState();
  }

  protected prevProposal(): void {
    const idx = this.selectedIndex();
    if (idx > 0) this.selectProposal(this.proposals[idx - 1].id);
  }

  protected nextProposal(): void {
    const idx = this.selectedIndex();
    if (idx >= 0 && idx < this.proposals.length - 1) this.selectProposal(this.proposals[idx + 1].id);
  }

  protected resetEffectState(): void {
    this.attemptCount.set(0);
    this.yesClicked.set(false);

    // Vuoto = "non ancora sparso": un solo Sì normale, nel flusso della pagina accanto al
    // No, stessa taglia — non fisso a schermo fin da subito (feedback di Rory: "il Sì è
    // molto più piccolo del No e resta fermo sullo schermo anche scrollando, mentre il No è
    // nella pagina" — i due dovevano comportarsi allo stesso modo finché non parte il primo
    // tentativo).
    this.yesPositions.set([]);
    this.noPos.set(null);

    this.bubblePopping.set(false);
    this.bubblePopped.set(false);
    this.poofParticles.set([]);

    this.noHiddenForRain.set(false);
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
    this.shellLabels.set(['Sì', 'Sì', 'No']);
    this.shellSlotOf.set([0, 1, 2]);
    this.shellPicked.set(null);

    this.dramaStep = 0;
    this.dramaText.set('No');
    this.dramaLeaving.set(false);

    this.fakeAlertOpen.set(false);
    this.poofOrigin.set(null);
    this.poofParticles.set([]);
  }

  // Tentativo di premere "No" (pointerdown/click, a seconda dell'effetto): smista sul
  // comportamento giusto.
  protected onNoInteract(): void {
    if (this.yesClicked()) return;
    this.attemptCount.update((n) => n + 1);

    switch (this.activeProposal().id) {
      case 'yes-multiply':
        this.yesPositions.update((positions) => {
          if (positions.length >= YES_MULTIPLY_CAP) return positions;
          // Dal primo tentativo: da "un solo Sì in pagina" a 2 sparsi, poi raddoppia ogni volta.
          const base = positions.length === 0 ? 1 : positions.length;
          const doubled = new Array(Math.min(base * 2, YES_MULTIPLY_CAP)).fill(null);
          return doubled.map(() => this.windowRandomPosition());
        });
        this.noPos.set(this.windowRandomPosition());
        break;

      case 'bubble':
        if (this.bubblePopped()) break;
        this.popBubble();
        break;

      case 'yes-rain':
        this.noHiddenForRain.set(true);
        this.startRain();
        break;

      case 'shell-game':
        this.playShellGame();
        break;

      case 'drama-queen':
        this.advanceDrama();
        break;

      case 'fake-error':
        this.fakeAlertOpen.set(true);
        break;

      default:
        this.noPos.set(this.windowRandomPosition());
    }
  }

  protected onYesClick(): void {
    this.yesClicked.set(true);
    if (this.rainSpawnTimer) {
      clearInterval(this.rainSpawnTimer);
      this.rainSpawnTimer = null;
    }
    if (this.rainRafId !== null) {
      cancelAnimationFrame(this.rainRafId);
      this.rainRafId = null;
    }
  }

  protected closeFakeAlert(): void {
    this.fakeAlertOpen.set(false);
    this.yesClicked.set(true);
  }

  // --- 2. bubble --------------------------------------------------------

  private popBubble(): void {
    const btn = this.noBtnRef()?.nativeElement;
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

  // --- 3. yes-rain --------------------------------------------------------

  private startRain(): void {
    if (this.rainSpawnTimer) return;
    this.rainSpawnTimer = setInterval(() => {
      if (this.rainSpawnedCount >= RAIN_MAX_SPAWNED) {
        if (this.rainSpawnTimer) clearInterval(this.rainSpawnTimer);
        this.rainSpawnTimer = null;
        return;
      }
      this.rainSpawnedCount++;
      const stage = this.stageRef()?.nativeElement;
      const width = stage?.clientWidth ?? 500;
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
          // rinfusa", non colonne perfette (feedback: "si impilano perfettamente").
          this.rainPileHeights[bucket] += RAIN_PILE_STEP + Math.random() * 10;
          return { ...drop, y: floorY, settled: true, rot: drop.rot + (Math.random() - 0.5) * 40 };
        }
        return { ...drop, y: nextY, vy: drop.vy + RAIN_GRAVITY, rot: drop.rot + drop.vrot };
      });
      if (changed) this.rainDrops.set(next);

      if (!this.yesClicked()) {
        this.rainRafId = requestAnimationFrame(step);
      }
    };
    this.rainRafId = requestAnimationFrame(step);
  }

  // --- 6. shell-game --------------------------------------------------------

  protected shellOffsetFor(cardIndex: number): number {
    const slot = this.shellSlotOf().indexOf(cardIndex);
    return (slot - cardIndex) * SHELL_CARD_STEP;
  }

  // Coperta (mostra il retro) durante flip/mescolamento sempre, e in "waiting" finché non è
  // quella scelta — un solo metodo condiviso da classe e transform, per evitare che le due
  // cose vadano fuori sincrono.
  protected isShellCardCovered(cardIndex: number): boolean {
    const phase = this.shellPhase();
    if (phase === 'flipped' || phase === 'shuffling') return true;
    if (phase === 'waiting') return this.shellPicked() !== cardIndex;
    return false;
  }

  protected shellCardTransform(cardIndex: number): string {
    const translate = `translateX(${this.shellOffsetFor(cardIndex)}px)`;
    return this.isShellCardCovered(cardIndex) ? `${translate} rotateY(180deg)` : translate;
  }

  // Prima del trucco: cliccare direttamente una "Sì" risponde subito, senza far partire
  // comunque l'animazione — solo la carta che dice davvero "No" fa scattare flip+mescola.
  // Dopo il mescolamento (fase "waiting"): le carte restano coperte. Il primo click su una
  // carta coperta la gira e basta (per farla "vedere", feedback di Rory) — non risponde
  // ancora e le altre due restano coperte e non cliccabili; serve un secondo click, proprio
  // su quella già scoperta, per confermarla come risposta.
  protected onShellCardClick(cardIndex: number): void {
    if (this.yesClicked()) return;

    if (this.shellPhase() === 'waiting') {
      if (this.shellPicked() === null) {
        this.shellPicked.set(cardIndex);
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
    this.onNoInteract();
  }

  private playShellGame(): void {
    if (this.shellPhase() !== 'idle') return;
    this.shellPhase.set('flipped');
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
          // Restano coperte: "waiting", non "revealed" — si scoprono solo al click
          // dell'utente, una alla volta (vedi onShellCardClick).
          this.shellPhase.set('waiting');
        }
      }, 320);
    }, 500);
  }

  // --- 7. drama-queen --------------------------------------------------------

  private advanceDrama(): void {
    if (this.dramaLeaving()) return;
    if (this.dramaStep >= this.dramaLines.length) {
      // La riga di addio è già a schermo da una pressione precedente: questa in più è
      // quella che lo fa volare via per davvero (feedback di Rory), non un timer automatico.
      this.dramaLeaving.set(true);
      this.noPos.set({ left: `${window.innerWidth + 200}px`, top: '30%' });
      return;
    }
    this.dramaText.set(this.dramaLines[this.dramaStep]);
    this.dramaStep++;
  }

  private windowRandomPosition(): Point {
    const left = 20 + Math.random() * (window.innerWidth - 140);
    const top = 120 + Math.random() * (window.innerHeight - 220);
    return { left: `${left}px`, top: `${top}px` };
  }

}
