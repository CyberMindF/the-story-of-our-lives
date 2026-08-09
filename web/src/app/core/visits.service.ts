import { Injectable } from '@angular/core';

// Porting fedele di assets/js/shared/visits.js.
@Injectable({ providedIn: 'root' })
export class VisitsService {
  // Registra la visita prima dell'autenticazione senza bloccare l'accesso in caso di errore.
  async captureAnonymousVisit(): Promise<void> {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }
    } catch (error) {
      console.warn('Impossibile registrare la visita anonima:', error);
    }
  }
}
