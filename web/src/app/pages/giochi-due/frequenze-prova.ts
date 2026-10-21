import { Component, OnInit, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { CoopRoom } from './coop-room';
import { CoopState } from './coop-models';

@Component({
  selector: 'app-frequenze-prova', imports: [AppShell, CoopRoom],
  template: `<app-shell homeHref="/tavolo-da-gioco/frequenze" homeLabel="Sulla stessa frequenza" homeAria="Torna al gioco">
    <h1>🧪 Prova da solo</h1><p>Due giocatori finti, tutte le prove disponibili. Non tocchi la partita con Desy: qui puoi vedere entrambi i lati e provare ogni comando.</p>
    @if(error()){<p role="alert">{{ error() }}</p><button class="btn" [disabled]="busy()" (click)="load()">Riprova</button>}
    <p><button class="btn" [disabled]="busy()" (click)="reset()">🔄 Azzera la prova</button></p>
    <div class="screens">@for(seat of seats;track seat){@let view = views()[seat];
      <section><h2>{{ seat === 'A' ? '🧑 Giocatore A' : '👩 Giocatore B' }}</h2>
        @if(view){<app-coop-room [state]="view" [userId]="seat === 'A' ? -101 : -102" [busy]="busy()" [canCreate]="seat === 'A'" [compact]="true" (command)="act(seat,$event.type,$event)" />}
      </section>
    }</div>
  </app-shell>`,
  styles: `h1{margin-top:2rem}.screens{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-block:1.5rem}.screens>section{min-width:0;padding:1rem;border:1px solid var(--border-color);border-radius:1.2rem;background:var(--input-bg)}p{line-height:1.6}@media(max-width:900px){.screens{grid-template-columns:1fr}}`
})
export class FrequenzeProva implements OnInit {
  protected readonly seats = ['A', 'B'] as const;
  protected readonly views = signal<Record<'A' | 'B', CoopState | null>>({ A: null, B: null });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  async ngOnInit(): Promise<void> { await this.load(); }
  private url(seat: string): string { return `/api/giochi-due/frequenze?practice=1&seat=${seat}`; }
  protected async load(): Promise<void> {
    this.busy.set(true);
    try {
      const responses = await Promise.all(this.seats.map(async seat => {
        const response = await fetch(this.url(seat)); const value = await response.json();
        if (!response.ok) throw new Error(value.error); return value as CoopState;
      }));
      this.views.set({ A: responses[0], B: responses[1] });
    } catch(e) { this.error.set(e instanceof Error ? e.message : 'Non riesco a caricare la prova.'); }
    finally { this.busy.set(false); }
  }
  protected async act(seat: 'A' | 'B', type: string, extra: Record<string, unknown> = {}): Promise<void> {
    if(this.busy() || !this.views()[seat]) return;
    this.busy.set(true); this.error.set('');
    try {
      const response = await fetch(this.url(seat), { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...extra,type,version:this.views()[seat]!.version,requestId:crypto.randomUUID()}) });
      const value = await response.json(); if(!response.ok) throw new Error(value.error);
    } catch(e) { this.error.set(e instanceof Error ? e.message : 'Non riesco a fare questa mossa.'); }
    finally { await this.load(); }
  }
  protected async reset(): Promise<void> { await this.act('A','practice-reset'); }
}
