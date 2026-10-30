import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

// Deny by default: nuove pagine e avventure vanno prima verificate.
export function isSafeRoute(url: string): boolean {
  const path = url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return ['/', '/login', '/profilo', '/novita', '/aula-studio', '/tavolo-da-gioco',
    '/tavolo-da-gioco/trappole', '/tavolo-da-gioco/frequenze', '/tavolo-da-gioco/animali',
    '/tavolo-da-gioco/gdr'].includes(path)
    || path.startsWith('/tavolo-da-gioco/gdr/')
    || /^\/aula-studio\/(quiz|quiz-misto)\/[^/]+$/.test(path);
}

@Injectable({ providedIn: 'root' })
export class SafeModeService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  // Fuori dall'account la presentazione è sempre neutra.
  readonly enabled = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly entryAuthenticated = signal(false);
  readonly entryChoice = signal<boolean | null>(null);

  apply(enabled: boolean): void {
    if (enabled) this.auth.adminModeEnabled.set(false);
    this.enabled.set(enabled);
    document.body.classList.toggle('safe-mode', enabled);
    const style = getComputedStyle(document.body);
    document.documentElement.style.backgroundColor = style.getPropertyValue('--bg-color').trim();
    document.documentElement.style.backgroundImage = enabled ? 'none' : style.backgroundImage;
  }

  chooseEntry(enabled: boolean): void {
    this.entryChoice.set(enabled);
    this.apply(enabled);
  }

  async save(enabled: boolean): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/auth/safe-mode', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error();
      this.apply(enabled);
      if (enabled && !isSafeRoute(this.router.url)) await this.router.navigateByUrl('/');
      return true;
    } catch {
      this.error.set('Non è stato possibile salvare la safe mode. Riprova.');
      return false;
    } finally { this.saving.set(false); }
  }
}
