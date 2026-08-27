import { Injectable, signal } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';

export interface RealtimeEvent {
  type: string;
  occurredAt: string;
  [key: string]: unknown;
}

export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly eventsSubject = new Subject<RealtimeEvent>();
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof window.setTimeout> | null = null;
  private shouldReconnect = false;
  private reconnectAttempt = 0;
  private availabilityChecked = false;
  private available = false;

  readonly state = signal<RealtimeConnectionState>('disconnected');
  readonly events: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  // App lo chiama dopo l'autenticazione; il controllo preliminare evita tentativi WebSocket
  // finché il binding Cloudflare non è stato effettivamente attivato.
  connect(): void {
    this.shouldReconnect = true;
    if (this.socket || this.state() === 'connecting') return;
    void this.connectWhenAvailable();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    this.socket?.close(1000, 'Client disconnect');
    this.socket = null;
    this.state.set('disconnected');
  }

  on(type: string): Observable<RealtimeEvent> {
    return this.events.pipe(filter((event) => event.type === type));
  }

  private async connectWhenAvailable(): Promise<void> {
    if (!this.availabilityChecked) {
      try {
        const response = await fetch('/api/realtime', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' }
        });
        const result = (await response.json().catch(() => ({}))) as { enabled?: boolean };
        this.available = response.ok && result.enabled === true;
      } catch {
        this.available = false;
      }
      this.availabilityChecked = true;
    }

    if (this.shouldReconnect && this.available && !this.socket) this.openSocket();
  }

  private openSocket(): void {
    this.state.set('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/realtime`);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.state.set('connected');
    });

    socket.addEventListener('message', (message) => {
      const event = parseRealtimeEvent(message.data);
      if (event) this.eventsSubject.next(event);
    });

    socket.addEventListener('close', () => {
      if (this.socket === socket) this.socket = null;
      this.state.set('disconnected');
      if (this.shouldReconnect) this.scheduleReconnect();
    });

    socket.addEventListener('error', () => socket.close());
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = Math.min(1_000 * 2 ** this.reconnectAttempt, 30_000);
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

function parseRealtimeEvent(value: unknown): RealtimeEvent | null {
  if (typeof value !== 'string') return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate['type'] !== 'string' || typeof candidate['occurredAt'] !== 'string') return null;
    return candidate as RealtimeEvent;
  } catch {
    return null;
  }
}
