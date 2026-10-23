import { Injectable, signal } from '@angular/core';

export interface CarteBustineBalance {
  quantitaDisponibile: number;
  minutiResidui: number;
}

export interface CarteBustineState {
  quantitaDisponibile: number;
  altroQuantitaDisponibile: number | null;
  altroNickname: string | null;
  minutiResidui: number;
  evocazioniDisponibili: number;
  bustineSenzaEvocazione: number;
  streakCorrente: number;
  streakMigliore: number;
  streakBustineBonus: number;
  streakPrimaVisitaOggi: boolean;
}

// Un'unica lettura per utente e caricamento dell'app: App la avvia appena l'accesso è
// completato, mentre la pagina Carte riusa la stessa Promise/risposta. In questo modo la
// streak è davvero di login senza aggiungere una chiamata a ogni navigazione e senza creare
// due richieste concorrenti quando la destinazione iniziale è proprio /carte.
@Injectable({ providedIn: 'root' })
export class CarteBustineService {
  readonly balance = signal<CarteBustineBalance | null>(null);
  readonly state = signal<CarteBustineState | null>(null);
  private userId: number | null = null;
  private request: Promise<CarteBustineState> | null = null;
  private loadedAt = 0;

  load(userId: number, maxAgeMs = Number.POSITIVE_INFINITY): Promise<CarteBustineState> {
    if (this.userId !== userId) {
      this.userId = userId;
      this.request = null;
      this.loadedAt = 0;
    }
    const requestIsRunning = this.request !== null && this.loadedAt === 0;
    const cachedStateIsFresh = this.request !== null && Date.now() - this.loadedAt <= maxAgeMs;
    if (requestIsRunning || cachedStateIsFresh) return this.request!;

    this.request = this.fetchState()
      .then((state) => {
        this.loadedAt = Date.now();
        this.balance.set({
          quantitaDisponibile: state.quantitaDisponibile,
          minutiResidui: state.minutiResidui
        });
        this.state.set(state);
        return state;
      })
      .catch((error) => {
        this.request = null;
        this.loadedAt = 0;
        throw error;
      });
    return this.request;
  }

  invalidate(): void {
    if (this.loadedAt > 0) {
      this.request = null;
      this.loadedAt = 0;
    }
  }

  clear(): void {
    this.userId = null;
    this.request = null;
    this.loadedAt = 0;
    this.balance.set(null);
    this.state.set(null);
  }

  async recordActiveMinute(userId: number): Promise<CarteBustineBalance> {
    const response = await fetch('/api/carte-bustine/presenza', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Aggiornamento presenza fallito: ${response.status}`);

    const data = (await response.json()) as Partial<CarteBustineBalance>;
    const balance = {
      quantitaDisponibile: data.quantitaDisponibile ?? 0,
      minutiResidui: data.minutiResidui ?? 0
    };
    if (this.userId === userId) {
      this.balance.set(balance);
      this.state.update((state) => state ? { ...state, ...balance } : state);
      if (this.request) {
        this.request = this.request.then((state) => ({ ...state, ...balance }));
      }
    }
    return balance;
  }

  updateOwnBalance(quantitaDisponibile: number, minutiResidui?: number): void {
    const current = this.balance();
    const balance = {
      quantitaDisponibile,
      minutiResidui: minutiResidui ?? current?.minutiResidui ?? 0
    };
    this.balance.set(balance);
    this.state.update((state) => state ? { ...state, ...balance } : state);
  }

  private async fetchState(): Promise<CarteBustineState> {
    const response = await fetch('/api/carte-bustine', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Caricamento bustine fallito: ${response.status}`);
    const data = (await response.json()) as Partial<CarteBustineState>;
    return {
      quantitaDisponibile: data.quantitaDisponibile ?? 0,
      altroQuantitaDisponibile: data.altroQuantitaDisponibile ?? null,
      altroNickname: data.altroNickname ?? null,
      minutiResidui: data.minutiResidui ?? 0,
      evocazioniDisponibili: data.evocazioniDisponibili ?? 0,
      bustineSenzaEvocazione: data.bustineSenzaEvocazione ?? 0,
      streakCorrente: data.streakCorrente ?? 0,
      streakMigliore: data.streakMigliore ?? 0,
      streakBustineBonus: data.streakBustineBonus ?? 0,
      streakPrimaVisitaOggi: data.streakPrimaVisitaOggi ?? false
    };
  }
}
