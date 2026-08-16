import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface PageWipResponse {
  enabled?: boolean;
  error?: string;
}

@Component({
  selector: 'app-page-wip',
  standalone: true,
  templateUrl: './page-wip.html',
  styleUrls: ['../../../styles/components/page-wip.css']
})
export class PageWip implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly pagePath = window.location.pathname.replace(/\/+$/, '') || '/';

  protected readonly enabled = signal(false);
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly canEdit = computed(
    () => this.authService.isAdmin() && this.authService.adminModeEnabled()
  );

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch(`/api/page-wip?path=${encodeURIComponent(this.pagePath)}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await this.api.readApiResponse<PageWipResponse>(response);
      this.enabled.set(result.enabled === true);
    } catch (error) {
      console.error('Impossibile caricare lo stato WIP della pagina:', error);
    } finally {
      this.loaded.set(true);
    }
  }

  protected async toggle(): Promise<void> {
    if (!this.canEdit() || this.saving()) return;

    const nextEnabled = !this.enabled();
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const response = await fetch('/api/page-wip', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ path: this.pagePath, enabled: nextEnabled })
      });
      const result = await this.api.readApiResponse<PageWipResponse>(response);
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      this.enabled.set(result.enabled === true);
    } catch (error) {
      console.error('Impossibile salvare lo stato WIP della pagina:', error);
      this.errorMessage.set('Non sono riuscito a salvare. Riprova.');
    } finally {
      this.saving.set(false);
    }
  }
}
