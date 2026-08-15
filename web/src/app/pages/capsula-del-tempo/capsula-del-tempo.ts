import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { AuthService, UserIdentity } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';

interface Capsula {
  id: string;
  unlockDate: string;
  authorIdentity: UserIdentity;
  isUnlocked: boolean;
  title: string | null;
  text: string | null;
  mediaKey: string | null;
  mediaType: 'photo' | 'video' | null;
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const IDENTITY_LABELS: Record<UserIdentity, string> = { lui: 'lui', lei: 'lei' };

@Component({
  selector: 'app-capsula-del-tempo',
  standalone: true,
  imports: [AppShell, FormsModule, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/capsula-del-tempo.css'],
  templateUrl: './capsula-del-tempo.html'
})
export class CapsulaDelTempo implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  protected readonly ownIdentity = computed<UserIdentity>(() => this.authService.currentUser()?.identity ?? 'lei');

  protected readonly capsule = signal<Capsula[]>([]);
  protected readonly loadError = signal(false);

  protected readonly formTitle = signal('');
  protected readonly formText = signal('');
  protected readonly formDate = signal('');
  protected readonly formFile = signal<File | null>(null);
  protected readonly minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly submitSuccess = signal(false);

  protected readonly deleteTargetId = signal<string | null>(null);

  protected readonly upcoming = computed(() => this.capsule().filter((c) => !c.isUnlocked));
  protected readonly opened = computed(() =>
    [...this.capsule()].filter((c) => c.isUnlocked).sort((a, b) => b.unlockDate.localeCompare(a.unlockDate))
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/capsule-tempo', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = await this.api.readApiResponse<{ capsule?: Capsula[] }>(response);
      this.capsule.set(data.capsule ?? []);
    } catch (error) {
      console.error('Errore nel caricamento delle capsule del tempo:', error);
      this.loadError.set(true);
    }
  }

  protected identityLabel(identity: UserIdentity): string {
    return IDENTITY_LABELS[identity];
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.formFile.set(input.files?.[0] ?? null);
  }

  protected async submit(): Promise<void> {
    const title = this.formTitle().trim();
    const text = this.formText().trim();
    const unlockDate = this.formDate();
    if (!title || !text || !unlockDate || this.submitting()) return;

    this.submitting.set(true);
    this.submitError.set('');
    this.submitSuccess.set(false);

    try {
      let mediaKey: string | undefined;
      let mediaType: 'photo' | 'video' | undefined;
      const file = this.formFile();
      if (file) {
        mediaType = PHOTO_TYPES.includes(file.type) ? 'photo' : VIDEO_TYPES.includes(file.type) ? 'video' : undefined;
        if (!mediaType) throw new Error('Formato del file non supportato.');

        const uploadResponse = await fetch(`/api/capsule-tempo/media?type=${mediaType}`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': file.type },
          body: file
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(typeof uploadResult.error === 'string' ? uploadResult.error : 'Upload del media non riuscito.');
        }
        mediaKey = uploadResult.key;
      }

      const response = await fetch('/api/capsule-tempo', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text, unlockDate, mediaKey, mediaType })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Creazione non riuscita.');
      }

      this.formTitle.set('');
      this.formText.set('');
      this.formDate.set('');
      this.formFile.set(null);
      this.submitSuccess.set(true);
      await this.load();
    } catch (error) {
      this.submitError.set(error instanceof Error ? error.message : 'Creazione non riuscita.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected mediaUrl(capsula: Capsula): string {
    return `/api/media/${capsula.mediaKey}`;
  }

  protected requestDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  protected cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.deleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/capsule-tempo/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }
}
