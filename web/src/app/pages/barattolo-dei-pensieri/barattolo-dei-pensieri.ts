import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { AuthService, UserIdentity } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { seededRotation } from '../../shared/random';

interface Biglietto {
  id: string;
  text: string;
  title: string | null;
}

// Riga completa dell'editor admin (GET /api/pensieri-biglietti): a differenza di Biglietto,
// contiene anche i campi di gestione (jarIdentity, isActive, position) e non è mai esposta ai
// membri non-admin — la sezione che la usa è dietro canEdit().
interface AdminBigliettoRow {
  id: string;
  jarIdentity: UserIdentity;
  text: string;
  title: string | null;
  isActive: boolean;
  position: number;
}

interface AdminDraft {
  text: string;
  title: string;
  isActive: boolean;
}

const IDENTITY_LABELS: Record<UserIdentity, string> = { lui: 'lui', lei: 'lei' };

@Component({
  selector: 'app-barattolo-dei-pensieri',
  standalone: true,
  imports: [AppShell, FormsModule, ConfirmationDialog],
  // modal.css qui perché, a differenza di ConfirmationDialog, il markup .modal per il
  // biglietto pescato vive nel template di QUESTO componente (serve l'animazione di
  // piegatura custom, non solo conferma/annulla) — l'incapsulamento Angular non lo eredita
  // dal componente condiviso, va referenziato anche qui (stesso schema di Calendario che
  // invece riusa <app-confirmation-dialog> di peso, vedi styles/components/modal.css).
  styleUrls: ['../../../styles/components/modal.css', '../../../styles/pages/barattolo-dei-pensieri.css'],
  templateUrl: './barattolo-dei-pensieri.html'
})
export class BarattoloDeiPensieri implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  protected readonly ownIdentity = computed<UserIdentity>(() => this.authService.currentUser()?.identity ?? 'lei');
  protected readonly otherIdentity = computed<UserIdentity>(() => (this.ownIdentity() === 'lui' ? 'lei' : 'lui'));
  protected readonly ownLabel = computed(() => IDENTITY_LABELS[this.ownIdentity()]);
  protected readonly otherLabel = computed(() => IDENTITY_LABELS[this.otherIdentity()]);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  protected readonly counts = signal<Record<UserIdentity, number>>({ lui: 0, lei: 0 });
  protected readonly loadError = signal(false);

  protected readonly writeText = signal('');
  protected readonly writeTitle = signal('');
  protected readonly writing = signal(false);
  protected readonly writeError = signal('');
  protected readonly writeSuccess = signal(false);

  protected readonly drawing = signal(false);
  protected readonly drawError = signal('');
  protected readonly drawnBiglietto = signal<Biglietto | null>(null);
  // Stessa formula di Lettere (seededRotation): stesso biglietto → sempre la stessa
  // inclinazione, non un valore diverso a ogni "Pesca ancora" sullo stesso id.
  protected readonly noteRotation = computed(() => seededRotation(Number(this.drawnBiglietto()?.id ?? 0)));

  // Editor admin: elenco completo (entrambi i barattoli), caricato solo se canEdit() — i
  // membri non-admin non fanno mai questa richiesta, quindi non ricevono mai i testi altrui.
  protected readonly adminBiglietti = signal<AdminBigliettoRow[]>([]);
  protected readonly adminLoadError = signal(false);
  protected readonly adminByJar = computed(() => {
    const groups: Record<UserIdentity, AdminBigliettoRow[]> = { lui: [], lei: [] };
    for (const row of [...this.adminBiglietti()].sort((a, b) => a.position - b.position)) {
      groups[row.jarIdentity].push(row);
    }
    return groups;
  });

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<AdminDraft>({ text: '', title: '', isActive: true });
  protected readonly draftError = signal('');

  protected readonly movingId = signal<string | null>(null);
  protected readonly moveAfterId = signal('');
  protected readonly moveError = signal('');

  protected readonly deleteTargetId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadCounts();
    if (this.canEdit()) {
      await this.loadAdminBiglietti();
    }
  }

  private async loadAdminBiglietti(): Promise<void> {
    try {
      const response = await fetch('/api/pensieri-biglietti', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = await this.api.readApiResponse<{ biglietti?: AdminBigliettoRow[] }>(response);
      this.adminBiglietti.set(data.biglietti ?? []);
    } catch (error) {
      console.error('Errore nel caricamento dei biglietti (editor):', error);
      this.adminLoadError.set(true);
    }
  }

  protected startEdit(row: AdminBigliettoRow): void {
    this.draft.set({ text: row.text, title: row.title ?? '', isActive: row.isActive });
    this.draftError.set('');
    this.editingId.set(row.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<AdminDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async saveEdit(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    const d = this.draft();
    if (!d.text.trim()) {
      this.draftError.set('Il testo non può essere vuoto.');
      return;
    }

    const ok = await this.api.sendAuthenticatedJson(`/api/pensieri-biglietti/${id}`, {
      text: d.text.trim(),
      title: d.title.trim() || undefined,
      isActive: d.isActive
    }, 'PUT');

    if (!ok) {
      this.draftError.set('Non è stato possibile salvare il biglietto.');
      return;
    }

    this.editingId.set(null);
    await this.loadAdminBiglietti();
    await this.loadCounts();
  }

  protected async moveBiglietto(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/pensieri-biglietti/${id}/move`, { direction }, 'POST');
    await this.loadAdminBiglietti();
  }

  protected startMove(id: string): void {
    this.movingId.set(id);
    this.moveAfterId.set('');
    this.moveError.set('');
  }

  protected cancelMove(): void {
    this.movingId.set(null);
  }

  protected biglittiForMoveTarget(jarIdentity: UserIdentity): AdminBigliettoRow[] {
    const movingId = this.movingId();
    return this.adminByJar()[jarIdentity].filter((row) => row.id !== movingId);
  }

  protected async confirmMove(): Promise<void> {
    const id = this.movingId();
    if (!id) return;
    const afterId = this.moveAfterId() || null;

    const ok = await this.api.sendAuthenticatedJson(`/api/pensieri-biglietti/${id}/move-to`, { afterId }, 'POST');
    if (!ok) {
      this.moveError.set('Non è stato possibile spostare il biglietto.');
      return;
    }

    this.movingId.set(null);
    await this.loadAdminBiglietti();
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
    await this.api.sendAuthenticatedJson(`/api/pensieri-biglietti/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.loadAdminBiglietti();
    await this.loadCounts();
  }

  private async loadCounts(): Promise<void> {
    try {
      const response = await fetch('/api/pensieri-biglietti/conteggi', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = (await response.json()) as Record<UserIdentity, number>;
      this.counts.set({ lui: data.lui ?? 0, lei: data.lei ?? 0 });
    } catch (error) {
      console.error('Errore nel caricamento dei conteggi del barattolo:', error);
      this.loadError.set(true);
    }
  }

  protected async submitBiglietto(): Promise<void> {
    const text = this.writeText().trim();
    if (!text || this.writing()) return;

    this.writing.set(true);
    this.writeError.set('');
    this.writeSuccess.set(false);

    try {
      const response = await fetch('/api/pensieri-biglietti', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title: this.writeTitle().trim() || undefined })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Invio non riuscito.');
      }

      this.writeText.set('');
      this.writeTitle.set('');
      this.writeSuccess.set(true);
      await this.loadCounts();
    } catch (error) {
      this.writeError.set(error instanceof Error ? error.message : 'Invio non riuscito.');
    } finally {
      this.writing.set(false);
    }
  }

  protected async draw(): Promise<void> {
    if (this.drawing()) return;
    this.drawing.set(true);
    this.drawError.set('');

    try {
      const response = await fetch('/api/pensieri-biglietti/pesca', {
        method: 'POST',
        credentials: 'same-origin'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Non è stato possibile pescare.');
      }

      this.drawnBiglietto.set({ id: String(result.id), text: result.text, title: result.title ?? null });
      await this.loadCounts();
    } catch (error) {
      this.drawError.set(error instanceof Error ? error.message : 'Non è stato possibile pescare.');
    } finally {
      this.drawing.set(false);
    }
  }

  protected putBack(): void {
    this.drawnBiglietto.set(null);
    this.drawError.set('');
  }

  // Chiude solo se il click arriva davvero dallo sfondo (non da un bubbling dal contenuto del
  // modale) — stesso schema di ConfirmationDialog.onBackdropClick.
  protected onModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.putBack();
  }
}
