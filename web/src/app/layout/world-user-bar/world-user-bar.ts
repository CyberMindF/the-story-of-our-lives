import { Component, Input, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NavigationService } from '../../core/navigation.service';

@Component({
  selector: 'app-world-user-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './world-user-bar.html'
})
export class WorldUserBar {
  @Input() extraClass = '';
  @Input() showSuggestLink = true;
  @Input() showHomeShortcut = true;
  @Input() beforeLogout: (() => Promise<void>) | null = null;

  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly changingAdminMode = signal(false);

  protected readonly authService = inject(AuthService);

  protected userName(): string | null {
    return this.authService.currentUser()?.nickname ?? null;
  }

  protected async toggleAdminMode(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const enabled = input.checked;
    const previous = this.authService.adminModeEnabled();
    this.authService.adminModeEnabled.set(enabled);
    this.changingAdminMode.set(true);
    const saved = await this.authService.setAdminMode(enabled);
    if (!saved) {
      this.authService.adminModeEnabled.set(previous);
      input.checked = previous;
    }
    this.changingAdminMode.set(false);
  }

  protected async onLogoutClick(): Promise<void> {
    this.loggingOut.set(true);
    if (this.beforeLogout) await this.beforeLogout();
    const response = await this.authService.revokeAuthSession();
    if (response.ok) {
      this.authService.clearAccessUnlock();
      this.authService.currentUser.set(null);
      this.navigationService.clearRequestedDestination();
      await this.router.navigateByUrl('/');
      return;
    }
    this.loggingOut.set(false);
  }
}
