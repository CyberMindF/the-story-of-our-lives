import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, UserIdentity } from './auth.service';
import { ApiService } from './api.service';
import { RealtimeService } from './realtime.service';

export interface ChatMessage {
  id: string;
  senderUserId: number;
  senderIdentity: UserIdentity;
  body: string | null;
  mediaKey: string | null;
  mediaType: 'photo' | 'video' | null;
  readAt: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalChatService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private originalTitle = document.title;
  private loadedForUserId: number | null = null;

  readonly messages = signal<ChatMessage[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly panelOpen = signal(false);
  readonly ownUserId = computed(() => this.auth.currentUser()?.id ?? null);

  constructor() {
    this.realtime.on('ponti-chat:changed').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => void this.loadRecent());
  }

  async startForCurrentUser(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (userId === undefined || this.loadedForUserId === userId) return;
    this.loadedForUserId = userId;
    await this.loadRecent();
  }

  clear(): void {
    this.loadedForUserId = null;
    this.messages.set([]);
    this.unreadCount.set(0);
    this.updateTitle();
  }

  async loadRecent(limit = 30): Promise<void> {
    if (!this.auth.currentUser()) return;
    this.loading.set(true);
    try {
      const response = await fetch(`/api/ponti-chat?limit=${limit}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const result = await this.api.readApiResponse<{ messages?: ChatMessage[]; unreadCount?: number }>(response);
      this.messages.set(result.messages ?? []);
      this.unreadCount.set(result.unreadCount ?? 0);
      this.updateTitle();
      if (this.panelOpen() && this.unreadCount()) void this.markRead();
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(): Promise<void> {
    if (!this.unreadCount()) return;
    const succeeded = await this.api.sendAuthenticatedJson('/api/ponti-chat/read', {}, 'POST');
    if (succeeded) {
      this.unreadCount.set(0);
      this.updateTitle();
    }
  }

  async sendText(body: string): Promise<boolean> {
    const response = await fetch('/api/ponti-chat', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body })
    });
    if (!response.ok) return false;
    const created = await this.api.readApiResponse<ChatMessage>(response) as ChatMessage;
    this.messages.update((messages) => [...messages, created]);
    return true;
  }

  mediaUrl(message: ChatMessage): string { return `/api/media/${message.mediaKey}`; }

  private updateTitle(): void {
    const current = document.title.replace(/^\(\d+\)\s*/, '');
    if (!this.unreadCount()) this.originalTitle = current;
    document.title = this.unreadCount() ? `(${this.unreadCount()}) ${this.originalTitle}` : this.originalTitle;
  }
}
