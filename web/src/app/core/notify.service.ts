import { Injectable } from '@angular/core';

// Notifica manuale via email (#f5): avvisa l'altra identità di un aggiornamento sul sito.
// Non manda nulla se l'altra identità non ha attivato notify_email_updates alla registrazione.
@Injectable({ providedIn: 'root' })
export class NotifyService {
  async notifyUpdate(message?: string, force = false): Promise<boolean> {
    const response = await fetch('/api/notify-update', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, force })
    });

    if (!response.ok) return false;
    const result = (await response.json()) as { sent?: boolean };
    return result.sent === true;
  }
}
