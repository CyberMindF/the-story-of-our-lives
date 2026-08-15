import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccessMode, AuthService, AuthUser } from '../core/auth.service';
import { NavigationService } from '../core/navigation.service';
import { PasswordField } from '../shared/password-field/password-field';
import { VisitsService } from '../core/visits.service';

// Porting di assets/js/shared/access-gate.js (createAccessGate) + assets/js/portone/main.js.
// Stessa logica (initialize/submit/setMode), stato esposto come signal invece che riletto dal
// DOM tramite getAccessElements(). CSS invariato (access-gate.css + pages/portone.css, stessi
// selettori) — la UI dovrebbe restare visivamente identica.
@Component({
  selector: 'app-portone',
  standalone: true,
  imports: [FormsModule, PasswordField],
  styleUrls: [
    '../../styles/components/access-gate.css',
    '../../styles/pages/portone.css'
  ],
  templateUrl: './portone.html'
})
export class Portone implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly visitsService = inject(VisitsService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AccessMode>('register');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly unlocked = signal(false);

  protected email = '';
  protected password = '';
  protected nickname = '';
  protected notifyEmailUpdates = false;
  protected worldKey = '';

  protected readonly isKeyOnly = computed(() => this.mode() === 'key');
  protected readonly isRegister = computed(() => this.mode() === 'register');

  protected readonly title = computed(() => {
    switch (this.mode()) {
      case 'key':
        return 'Ti ricordi della chiave?';
      case 'login':
        return 'Rieccoci nel nostro mondo';
      default:
        return 'È la prima volta che sei qui?';
    }
  });

  protected readonly text = computed(() => {
    switch (this.mode()) {
      case 'key':
        return 'Come la prima volta inseriscila nella serratura e il mondo si aprirà.';
      case 'login':
        return 'Accedi per tornare a sederti su quel divano.';
      default:
        return 'Crea il tuo account per entrare nel nostro mondo e accedere a tutte le funzionalità.';
    }
  });

  protected readonly submitLabel = computed(() => {
    if (this.loading()) {
      return 'Attendi…';
    }
    if (this.mode() === 'key') {
      return 'Entra';
    }
    if (this.mode() === 'login') {
      return 'Accedi ed entra';
    }
    return 'Registrati ed entra';
  });

  ngOnInit(): void {
    void this.initialize();
  }

  // Registra la visita, verifica la sessione e decide quale passaggio di accesso mostrare.
  private async initialize(): Promise<void> {
    this.navigationService.rememberRequestedDestination();
    await this.visitsService.captureAnonymousVisit();

    const session = await this.authService.loadAuthSession();
    if (!session.authenticated) {
      this.mode.set(this.authService.getInitialAccessMode());
      return;
    }
    if (!session.user || !this.authService.isAccessUnlocked(session.user.id)) {
      this.mode.set('key');
      return;
    }

    await this.completeAccess(session.user);
  }

  protected setMode(mode: AccessMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  // Invia i dati richiesti dalla modalità corrente e completa l'accesso quando sono validi.
  protected async submit(): Promise<void> {
    const mode = this.mode();
    const payload: Record<string, unknown> = { worldKey: this.worldKey.trim() };

    if (mode !== 'key') {
      payload['email'] = this.email.trim();
      payload['password'] = this.password;
    }
    if (mode === 'register') {
      payload['nickname'] = this.nickname.trim();
      payload['notifyEmailUpdates'] = this.notifyEmailUpdates;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { response, result } = await this.authService.submitAuthRequest(mode, payload);
      if (!response.ok) {
        if (response.status === 401 && mode === 'key') {
          this.setMode('login');
        }
        throw new Error(result.error || 'Accesso non riuscito.');
      }
      if (!result.user) {
        throw new Error('Risposta inattesa dal server.');
      }

      this.authService.rememberAccessUnlock(result.user.id, mode !== 'key');
      await this.completeAccess(result.user);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : "Impossibile completare l'accesso.");
    } finally {
      this.loading.set(false);
    }
  }

  // Mostra l'utente sbloccato e prosegue verso la destinazione richiesta, senza reload —
  // deviazione intenzionale dall'originale (che qui faceva window.location.replace/reload):
  // qui usiamo il Router, coerente con l'obiettivo dell'intera migrazione.
  private async completeAccess(user: AuthUser): Promise<void> {
    this.authService.currentUser.set(user);
    // Login/registrazione producono sempre una sessione nuova, quindi la Modalità admin
    // riparte spenta (vive sulla sessione, non sull'utente — vedi setAdminMode).
    this.authService.adminModeEnabled.set(false);
    this.unlocked.set(true);

    // Stesso fallback di assets/js/portone/main.js (onUnlock -> "./mondo-bianco/"): senza una
    // destinazione richiesta valida, si va all'hub, che ora vive su "/" (il Portone è "/login").
    const safeTarget = this.navigationService.consumeRequestedDestination();
    await this.router.navigateByUrl(safeTarget || '/');
  }
}
