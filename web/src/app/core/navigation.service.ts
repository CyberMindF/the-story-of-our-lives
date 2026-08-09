import { Injectable } from '@angular/core';

const RETURN_TARGET_KEY = 'mondo-bianco-return-target-v1';

// Porting fedele di assets/js/shared/navigation.js. Nota per le fasi successive: una volta
// che il routing reale è in piedi (Fase 3+), returnToRequestedDestination dovrebbe passare
// da window.location.replace a router.navigateByUrl per restare senza reload — qui per ora
// resta identico all'originale perché il router non è ancora la fonte di navigazione.
@Injectable({ providedIn: 'root' })
export class NavigationService {
  // Conserva la pagina interna corrente prima di passare dal Portone.
  rememberCurrentDestination(): string {
    const currentTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem(RETURN_TARGET_KEY, currentTarget);
    return currentTarget;
  }

  // Dimentica qualsiasi destinazione interna quando l'utente sceglie di uscire dal Mondo Bianco.
  clearRequestedDestination(): void {
    sessionStorage.removeItem(RETURN_TARGET_KEY);
  }

  // Memorizza il parametro returnTo soltanto se rappresenta una destinazione interna sicura.
  rememberRequestedDestination(): void {
    const requestedTarget = new URLSearchParams(window.location.search).get('returnTo');
    if (!requestedTarget) {
      return;
    }

    const safeTarget = this.getSafeReturnTarget(requestedTarget);
    if (safeTarget) {
      sessionStorage.setItem(RETURN_TARGET_KEY, safeTarget);
    } else {
      sessionStorage.removeItem(RETURN_TARGET_KEY);
      console.warn("Destinazione successiva all'accesso non valida.");
    }
  }

  // Consuma la destinazione salvata e vi reindirizza il browser dopo un accesso riuscito.
  // Fedele all'originale (window.location.replace, quindi un reload pieno) — usata solo dove
  // serve replicare esattamente quel comportamento. Nel flusso Angular vero (Portone dopo
  // login) si preferisce consumeRequestedDestination() + Router, per restare senza reload.
  returnToRequestedDestination(): boolean {
    const safeTarget = this.consumeRequestedDestination();
    if (!safeTarget) {
      return false;
    }

    window.location.replace(safeTarget);
    return true;
  }

  // Come returnToRequestedDestination, ma restituisce solo la destinazione (già convalidata
  // e già rimossa da sessionStorage) senza navigare — lascia al chiamante scegliere come
  // spostarsi (es. Router.navigateByUrl, senza reload).
  consumeRequestedDestination(): string | null {
    const savedTarget = sessionStorage.getItem(RETURN_TARGET_KEY);
    const safeTarget = this.getSafeReturnTarget(savedTarget);
    sessionStorage.removeItem(RETURN_TARGET_KEY);
    return safeTarget;
  }

  // Accetta esclusivamente URL dello stesso sito, escludendo API e ritorni alla pagina corrente.
  getSafeReturnTarget(value: string | null): string | null {
    if (!value) {
      return null;
    }

    try {
      const target = new URL(value, window.location.origin);
      const currentPath = this.normalizePagePath(window.location.pathname);
      const targetPath = this.normalizePagePath(target.pathname);

      if (target.origin !== window.location.origin || target.pathname.startsWith('/api/')) {
        return null;
      }
      if (targetPath === currentPath) {
        return null;
      }

      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return null;
    }
  }

  // Considera equivalenti una directory e il relativo file index.html.
  private normalizePagePath(pathname: string): string {
    return pathname.replace(/\/index\.html$/, '/');
  }
}
