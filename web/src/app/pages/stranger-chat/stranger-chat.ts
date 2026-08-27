import { Component, DestroyRef, ElementRef, Injector, OnInit, ViewChild, afterNextRender, computed, inject, runInInjectionContext, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AuthService, UserIdentity } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';

interface ChatMessage {
  id: string;
  senderIdentity: UserIdentity;
  body: string;
  createdAt: string;
}

// "Ricomincia da Capo" (#g1): stessa struttura di PontiChat (fetch al montaggio, invio ottimistico,
// eliminazione del proprio messaggio), senza media/read-receipt — qui serve solo il minimo, e
// con una schermata iniziale in stile Omegle prima di entrare in chat.
@Component({
  selector: 'app-stranger-chat',
  standalone: true,
  imports: [AppShell, FormsModule, RouterLink],
  styleUrls: ['../../../styles/pages/stranger-chat.css'],
  templateUrl: './stranger-chat.html'
})
export class StrangerChat implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly realtime = inject(RealtimeService);

  @ViewChild('log') private log?: ElementRef<HTMLElement>;

  protected readonly ownIdentity = computed<UserIdentity>(() => this.authService.currentUser()?.identity ?? 'lei');

  protected readonly entered = signal(false);

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly composeText = signal('');
  protected readonly sending = signal(false);
  protected readonly sendError = signal('');

  async ngOnInit(): Promise<void> {
    // Basta caricare la cronologia già al montaggio: è leggera (solo testo) e la schermata
    // d'ingresso resta comunque il primo passaggio obbligato per l'utente.
    await this.loadMessages();
    this.realtime.on('stranger-chat:changed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event['actorUserId'] !== this.authService.currentUser()?.id) void this.loadMessages();
      });
  }

  protected enter(): void {
    this.entered.set(true);
    this.scrollToBottom();
  }

  // Il bottone "New" della barra inferiore, come nell'originale, riporta alla schermata
  // d'ingresso invece di terminare davvero la conversazione (qui non ci sono sconosciuti da
  // cambiare, solo i due di sempre — la cronologia resta, si torna solo alla domanda iniziale).
  protected stop(): void {
    this.entered.set(false);
  }

  private async loadMessages(): Promise<void> {
    try {
      const response = await fetch('/api/stranger-chat', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = await this.api.readApiResponse<{ messages?: ChatMessage[] }>(response);
      this.messages.set(data.messages ?? []);
      this.loadError.set(false);
      this.loading.set(false);
      if (this.entered()) this.scrollToBottom();
    } catch (error) {
      console.error('Errore nel caricamento della chat:', error);
      this.loadError.set(true);
      this.loading.set(false);
    }
  }

  private scrollToBottom(): void {
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => {
        const el = this.log?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected async send(): Promise<void> {
    const text = this.composeText().trim();
    if (!text || this.sending()) return;

    this.sending.set(true);
    this.sendError.set('');

    try {
      const response = await fetch('/api/stranger-chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Invio non riuscito.');
      }

      this.messages.set([...this.messages(), result as ChatMessage]);
      this.composeText.set('');
      this.scrollToBottom();
    } catch (error) {
      this.sendError.set(error instanceof Error ? error.message : 'Invio non riuscito.');
    } finally {
      this.sending.set(false);
    }
  }

}
