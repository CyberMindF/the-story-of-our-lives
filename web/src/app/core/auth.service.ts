import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: AuthUser;
  expiresAt?: string;
  error?: string;
}

export type AccessMode = 'login' | 'register' | 'key';

const ACCESS_SESSION_KEY = 'noi-crossword-access-session-v1';
const KNOWN_ACCOUNT_STORAGE_KEY = 'noi-crossword-known-account-v1';

// Porting fedele di assets/js/shared/auth.js. In più: currentUser come signal, così la shell
// (saluto/logout) e la guardia di rotta possono reagire senza dover rileggere il DOM.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  readonly currentUser = signal<AuthUser | null>(null);

  // Chiede al backend se il cookie HttpOnly identifica ancora una sessione valida.
  async loadAuthSession(): Promise<AuthSessionResponse> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        return { authenticated: false };
      }

      return (await this.api.readApiResponse<AuthSessionResponse>(response)) as AuthSessionResponse;
    } catch (error) {
      console.warn('Impossibile verificare la sessione:', error);
      return { authenticated: false };
    }
  }

  // Invia registrazione, login o conferma della sola Chiave all'endpoint corretto.
  async submitAuthRequest(
    mode: AccessMode,
    payload: Record<string, unknown>
  ): Promise<{ response: Response; result: AuthSessionResponse }> {
    const endpoint = mode === 'key' ? '/api/auth/session' : `/api/auth/${mode}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { response, result: (await this.api.readApiResponse<AuthSessionResponse>(response)) as AuthSessionResponse };
  }

  // Revoca la sessione corrente sul backend.
  async revokeAuthSession(): Promise<Response> {
    return fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin'
    });
  }

  // Restituisce la modalità iniziale più adatta in base alla presenza di un account già usato.
  getInitialAccessMode(): 'login' | 'register' {
    return localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY) === 'true' ? 'login' : 'register';
  }

  // Verifica se la Chiave è già stata confermata in questa scheda per l'utente corrente.
  isAccessUnlocked(userId: number | string): boolean {
    return sessionStorage.getItem(ACCESS_SESSION_KEY) === String(userId);
  }

  // Memorizza lo sblocco della scheda e, dopo login o registrazione, la presenza dell'account.
  rememberAccessUnlock(userId: number | string, rememberAccount = false): void {
    sessionStorage.setItem(ACCESS_SESSION_KEY, String(userId));
    if (rememberAccount) {
      localStorage.setItem(KNOWN_ACCOUNT_STORAGE_KEY, 'true');
    }
  }

  // Rimuove soltanto lo sblocco locale della scheda, senza cancellare progresso o preferenze.
  clearAccessUnlock(): void {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
  }
}
