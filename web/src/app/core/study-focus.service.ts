import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'noi-aula-studio-zero-distrazioni';

function readPreference(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

// La preferenza dura quanto la scheda del browser, ma diventa attiva soltanto mentre la route
// dell'Aula studio è montata. In questo modo gli effetti tornano appena si lascia la pagina.
@Injectable({ providedIn: 'root' })
export class StudyFocusService {
  readonly enabled = signal(readPreference());
  readonly active = signal(false);

  enterPage(): void {
    this.setActive(this.enabled());
  }

  leavePage(): void {
    this.setActive(false);
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // La modalità continua a funzionare per la pagina corrente anche senza storage.
    }
    this.setActive(enabled);
  }

  private setActive(active: boolean): void {
    this.active.set(active);
    document.body.classList.toggle('study-zero-distractions', active);
  }
}
