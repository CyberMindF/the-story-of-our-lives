import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../core/notify.service';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { FormStatus } from '../../shared/form-status/form-status';
import { SubmissionStatus } from '../../shared/form-submission/form-submission';
import { PasswordField } from '../../shared/password-field/password-field';
import { ApiService } from '../../core/api.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';

interface TestAccount {
  id: number;
  email: string;
  nickname: string;
  identity: 'lui' | 'lei';
  is_activated: number;
  created_at: string;
}

interface ActivityLoggingUser {
  id: number;
  email: string;
  nickname: string;
  identity: 'lui' | 'lei';
  is_test: number;
  activity_logging_enabled: number;
}

// Cambio nickname/password (backlog #2). Due form indipendenti (azioni separate lato
// backend), stesso pattern manuale signal loading/status/message già usato in Portone —
// non FormSubmission (lavora su FormData, qui serve JSON per parlare con AuthService).
@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, PasswordField, RouterLink, EditorialText, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/profilo.css'],
  templateUrl: './profilo.html'
})
export class Profilo {
  protected readonly authService = inject(AuthService);
  private readonly notifyService = inject(NotifyService);
  private readonly api = inject(ApiService);

  protected nickname = this.authService.currentUser()?.nickname ?? '';
  protected readonly nicknameLoading = signal(false);
  protected readonly nicknameStatus = signal<SubmissionStatus>('');
  protected readonly nicknameMessage = signal('');

  protected currentPassword = '';
  protected newPassword = '';
  protected confirmNewPassword = '';
  protected readonly passwordLoading = signal(false);
  protected readonly passwordStatus = signal<SubmissionStatus>('');
  protected readonly passwordMessage = signal('');

  protected notifyMessage = '';
  protected readonly notifyLoading = signal(false);
  protected readonly notifyStatus = signal<SubmissionStatus>('');
  protected readonly notifyResultMessage = signal('');

  protected readonly testAccounts = signal<TestAccount[]>([]);
  protected readonly testAccountsLoading = signal(false);
  protected readonly testAccountMessage = signal('');
  protected testNickname = 'Test Rory';
  protected testEmail = '';
  protected testPassword = '';
  protected testIdentity: 'lui' | 'lei' = 'lui';
  protected readonly testActionTarget = signal<TestAccount | null>(null);
  protected readonly testAction = signal<'reset' | 'delete' | null>(null);
  protected readonly activityLoggingUsers = signal<ActivityLoggingUser[]>([]);
  protected readonly activityLoggingMessage = signal('');
  private testAccountsLoaded = false;
  private activityLoggingLoaded = false;

  constructor() {
    effect(() => {
      if (!this.authService.adminModeEnabled()) return;
      if (!this.testAccountsLoaded) void this.loadTestAccounts();
      if (!this.activityLoggingLoaded) void this.loadActivityLoggingUsers();
    });
  }

  protected async submitNickname(): Promise<void> {
    const nickname = this.nickname.trim();
    if (!nickname) {
      this.nicknameStatus.set('error');
      this.nicknameMessage.set('Il nome non può essere vuoto.');
      return;
    }

    this.nicknameLoading.set(true);
    this.nicknameStatus.set('');
    this.nicknameMessage.set('');

    try {
      const { response, result } = await this.authService.updateNickname(nickname);
      if (!response.ok || !result.user) {
        throw new Error(result.error || 'Impossibile salvare il nome.');
      }

      this.authService.currentUser.set(result.user);
      this.nickname = result.user.nickname;
      this.nicknameStatus.set('success');
      this.nicknameMessage.set('Nome salvato.');
    } catch (error) {
      this.nicknameStatus.set('error');
      this.nicknameMessage.set(error instanceof Error ? error.message : 'Impossibile salvare il nome.');
    } finally {
      this.nicknameLoading.set(false);
    }
  }

  // Controlli client-side prima della chiamata: il server rivalida comunque tutto.
  protected async submitPassword(): Promise<void> {
    this.passwordStatus.set('');
    this.passwordMessage.set('');

    if (this.newPassword.length < 8) {
      this.passwordStatus.set('error');
      this.passwordMessage.set('La nuova password deve contenere almeno 8 caratteri.');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordStatus.set('error');
      this.passwordMessage.set('Le due password non coincidono.');
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.passwordStatus.set('error');
      this.passwordMessage.set('La nuova password deve essere diversa da quella attuale.');
      return;
    }

    this.passwordLoading.set(true);

    try {
      const { response, result } = await this.authService.updatePassword(this.currentPassword, this.newPassword);
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Impossibile cambiare la password.');
      }

      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
      this.passwordStatus.set('success');
      this.passwordMessage.set('Password aggiornata.');
    } catch (error) {
      this.passwordStatus.set('error');
      this.passwordMessage.set(error instanceof Error ? error.message : 'Impossibile cambiare la password.');
    } finally {
      this.passwordLoading.set(false);
    }
  }

  protected async submitNotify(): Promise<void> {
    this.notifyLoading.set(true);
    this.notifyStatus.set('');
    this.notifyResultMessage.set('');

    try {
      const sent = await this.notifyService.notifyUpdate(this.notifyMessage.trim() || undefined);
      this.notifyStatus.set('success');
      this.notifyResultMessage.set(
        sent ? 'Avviso inviato.' : "Nessuna email inviata: l'altra persona non ha attivato le notifiche."
      );
      this.notifyMessage = '';
    } catch {
      this.notifyStatus.set('error');
      this.notifyResultMessage.set("Non è stato possibile inviare l'avviso.");
    } finally {
      this.notifyLoading.set(false);
    }
  }

  protected onTestIdentityChange(identity: 'lui' | 'lei'): void {
    this.testIdentity = identity;
    this.testNickname = identity === 'lui' ? 'Test Rory' : 'Test Desy';
  }

  protected async createTestAccount(): Promise<void> {
    this.testAccountMessage.set('');
    const response = await fetch('/api/auth/test-account', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.testEmail, password: this.testPassword, nickname: this.testNickname, identity: this.testIdentity })
    });
    const result = await this.api.readApiResponse<{ user?: TestAccount; error?: string }>(response);
    if (!response.ok || !('user' in result) || !result.user) {
      this.testAccountMessage.set(('error' in result && result.error) || 'Non è stato possibile creare l’account test.');
      return;
    }
    this.testEmail = '';
    this.testPassword = '';
    this.testAccountMessage.set(`${result.user.nickname} creato. Puoi usarlo subito in un altro browser.`);
    await this.loadTestAccounts();
  }

  protected requestTestAction(account: TestAccount, action: 'reset' | 'delete'): void {
    this.testActionTarget.set(account);
    this.testAction.set(action);
  }

  protected cancelTestAction(): void {
    this.testActionTarget.set(null);
    this.testAction.set(null);
  }

  protected async confirmTestAction(): Promise<void> {
    const account = this.testActionTarget();
    const action = this.testAction();
    if (!account || !action) return;
    const endpoint = action === 'reset' ? `/api/auth/test-account/${account.id}/reset` : `/api/auth/test-account/${account.id}`;
    const response = await fetch(endpoint, { method: action === 'reset' ? 'POST' : 'DELETE', credentials: 'same-origin' });
    const result = await this.api.readApiResponse<{ error?: string; deletedMedia?: number }>(response);
    this.cancelTestAction();
    if (!response.ok) {
      this.testAccountMessage.set(('error' in result && result.error) || 'Operazione non riuscita.');
      return;
    }
    this.testAccountMessage.set(action === 'reset'
      ? `${account.nickname} ripulito: account e credenziali sono rimasti attivi.`
      : `${account.nickname} eliminato definitivamente.`);
    await this.loadTestAccounts();
  }

  protected async setActivityLogging(user: ActivityLoggingUser, input: HTMLInputElement): Promise<void> {
    const enabled = input.checked;
    input.disabled = true;
    this.activityLoggingMessage.set('');
    try {
      const response = await fetch('/api/auth/activity-logging', {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, enabled })
      });
      if (!response.ok) throw new Error('Aggiornamento non riuscito');
      this.activityLoggingUsers.update((users) => users.map((item) => item.id === user.id
        ? { ...item, activity_logging_enabled: enabled ? 1 : 0 }
        : item));
      this.activityLoggingMessage.set(enabled
        ? `Da ora registriamo le attività di ${user.nickname}.`
        : `Le attività di ${user.nickname} non verranno più registrate né notificate via email.`);
    } catch {
      input.checked = !enabled;
      this.activityLoggingMessage.set('Non è stato possibile aggiornare il logging.');
    } finally {
      input.disabled = false;
    }
  }

  private async loadTestAccounts(): Promise<void> {
    this.testAccountsLoading.set(true);
    try {
      const response = await fetch('/api/auth/test-account', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const result = await this.api.readApiResponse<{ users?: TestAccount[] }>(response);
      if (response.ok && 'users' in result) {
        this.testAccounts.set(result.users ?? []);
        this.testAccountsLoaded = true;
      }
    } finally {
      this.testAccountsLoading.set(false);
    }
  }

  private async loadActivityLoggingUsers(): Promise<void> {
    const response = await fetch('/api/auth/activity-logging', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const result = await this.api.readApiResponse<{ users?: ActivityLoggingUser[] }>(response);
    if (response.ok && 'users' in result) {
      this.activityLoggingUsers.set(result.users ?? []);
      this.activityLoggingLoaded = true;
    }
  }

}
