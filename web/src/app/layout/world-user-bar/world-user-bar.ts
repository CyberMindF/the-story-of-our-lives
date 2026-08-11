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

  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);

  protected userName(): string | null {
    return this.authService.currentUser()?.nickname ?? null;
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
