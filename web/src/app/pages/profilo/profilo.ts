import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { AuthService } from '../../core/auth.service';
import { FormStatus } from '../../shared/form-status/form-status';
import { SubmissionStatus } from '../../shared/form-submission/form-submission';
import { PasswordField } from '../../shared/password-field/password-field';

// Cambio nickname/password (backlog #2). Due form indipendenti (azioni separate lato
// backend), stesso pattern manuale signal loading/status/message già usato in Portone —
// non FormSubmission (lavora su FormData, qui serve JSON per parlare con AuthService).
@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, PasswordField],
  styleUrls: ['../../../styles/pages/profilo.css'],
  templateUrl: './profilo.html'
})
export class Profilo {
  protected readonly authService = inject(AuthService);

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

  // Ottimistico come gli altri interruttori del sito (world-settings.service.ts): riflette
  // subito il click, poi torna indietro solo se il backend rifiuta (sessione persa, ruolo
  // cambiato altrove).
  protected async toggleAdminMode(event: Event): Promise<void> {
    const enabled = (event.target as HTMLInputElement).checked;
    const previous = this.authService.adminModeEnabled();
    this.authService.adminModeEnabled.set(enabled);
    const saved = await this.authService.setAdminMode(enabled);
    if (!saved) {
      this.authService.adminModeEnabled.set(previous);
    }
  }
}
