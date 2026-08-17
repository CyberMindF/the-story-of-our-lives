import { Injectable } from '@angular/core';

export interface CarteBustineState {
  quantitaDisponibile: number;
  minutiResidui: number;
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
      minutiResidui: data.minutiResidui ?? 0,
      streakCorrente: data.streakCorrente ?? 0,
      streakMigliore: data.streakMigliore ?? 0,
      streakBustineBonus: data.streakBustineBonus ?? 0,
      streakPrimaVisitaOggi: data.streakPrimaVisitaOggi ?? false
    };
  }
}
