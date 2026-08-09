import { Injectable } from '@angular/core';

// Porting fedele di assets/js/shared/api.js — stessa firma, stesso comportamento.
@Injectable({ providedIn: 'root' })
export class ApiService {
  // Legge una risposta JSON e restituisce un oggetto vuoto quando il corpo non è valido.
  async readApiResponse<T = unknown>(response: Response): Promise<T | Record<string, never>> {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  // Invia JSON a un endpoint autenticato senza interrompere l'interfaccia in caso di errore di rete.
  async sendAuthenticatedJson(endpoint: string, payload: unknown, method = 'POST'): Promise<boolean> {
    try {
      const response = await fetch(endpoint, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      return response.ok;
    } catch (error) {
      console.warn(`Impossibile completare la richiesta ${method} ${endpoint}:`, error);
      return false;
    }
  }
}
