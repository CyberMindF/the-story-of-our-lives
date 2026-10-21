import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';

interface PracticeView { version: number; room: null | { id: string; status: string; role: string; round: number; ready: boolean; errors: number; lastWrong: boolean; sequence: string[]; legend: { symbol: string; number: number }[]; instruction: string | null }; }
@Component({
  selector: 'app-frequenze-prova', imports: [AppShell, FormsModule],
  template: `<app-shell homeHref="/tavolo-da-gioco/frequenze" homeLabel="Sulla stessa frequenza" homeAria="Torna al gioco">
    <h1>🧪 Prova da solo</h1><p>Questi sono due giocatori finti. Non tocchi la partita con Desy: puoi provare entrambi i ruoli e ricominciare quando vuoi.</p>
    @if(error()){<p role="alert">{{ error() }}</p><button class="btn" (click)="load()">Riprova</button>}
    <p><button class="btn" [disabled]="busy()" (click)="reset()">🔄 Azzera la prova</button></p>
    <div class="screens">@for(seat of seats;track seat){@let view = views()[seat];
      <section><h2>{{ seat === 'A' ? '🧑 Giocatore A' : '👩 Giocatore B' }}</h2>
      @if(view){@if(view.room;as r){
        @if(r.status === 'waiting'){
          <p>Stanza aperta. Entra anche con il giocatore B.</p>@if(seat === 'B'){<button class="btn" [disabled]="busy()" (click)="act(seat,'join',{id:r.id})">Entra come B</button>}
        }@else if(r.status === 'playing'){
          <p>Serratura {{r.round+1}}/3 · {{r.errors}} errori</p><h3>{{r.role==='explorer'?'Hai la sequenza':'Hai la legenda'}}</h3>
          @if(r.role==='guide'){
            <p>{{r.instruction}}</p><div class="legend">@for(e of r.legend;track e.symbol){<span>{{e.symbol}} = {{e.number}}</span>}</div>
            <button class="btn" [disabled]="busy()||r.ready" (click)="act(seat,'ready',{id:r.id})">{{r.ready?'Pronto!':'Sono pronto'}}</button>
          }@else{
            <p class="symbols">{{r.sequence.join(' ')}}</p>
            <label>Codice<input [disabled]="busy()" [ngModel]="codes()[seat]" (ngModelChange)="setCode(seat,$event)" inputmode="numeric" [maxlength]="r.round+4" /></label>
            <button class="btn" [disabled]="busy()||!r.ready||codes()[seat].length!==r.round+4" (click)="act(seat,'answer',{id:r.id,code:codes()[seat]})">Prova il codice</button>
          }
          @if(r.lastWrong){<p role="status">Codice sbagliato. Puoi riprovare.</p>}
        }@else{<h3>🎉 Prova completata</h3><p>{{r.errors}} errori. Puoi azzerare la prova per ricominciare.</p>}
      }@else{@if(seat==='A'){<button class="btn" [disabled]="busy()" (click)="act(seat,'create')">Apri la stanza come A</button>}@else{<p>Apri prima la stanza con A.</p>}}}
      </section>
    }</div>
  </app-shell>`,
  styles: `h1{margin-top:2rem}.screens{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-block:1.5rem}.screens section{min-width:0;padding:1.4rem;border:1px solid var(--border-color);border-radius:1.2rem;background:var(--input-bg)}p{line-height:1.6}.legend{display:grid;grid-template-columns:repeat(2,1fr);gap:.8rem;font-size:1.3rem;margin:1rem 0}.symbols{font-size:1.8rem;overflow-wrap:anywhere}label{display:grid;gap:.5rem;margin-block:1rem}input{width:100%;box-sizing:border-box;border:1px solid var(--border-color);border-radius:.6rem;padding:.8rem;background:var(--bg-color);color:var(--text-color);font:inherit}@media(max-width:700px){.screens{grid-template-columns:1fr}}`
})
export class FrequenzeProva implements OnInit {
  protected readonly seats = ['A', 'B'] as const;
  protected readonly views = signal<Record<'A' | 'B', PracticeView | null>>({ A: null, B: null });
  protected readonly codes = signal({ A: '', B: '' });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  async ngOnInit(): Promise<void> { await this.load(); }
  private url(seat: string): string { return `/api/giochi-due/frequenze?practice=1&seat=${seat}`; }
  protected async load(): Promise<void> {
    this.busy.set(true);
    try {
      const responses = await Promise.all(this.seats.map(async seat => {
        const response = await fetch(this.url(seat)); const value = await response.json();
        if (!response.ok) throw new Error(value.error); return value as PracticeView;
      }));
      this.views.set({ A: responses[0], B: responses[1] });
    } catch(e) { this.error.set(e instanceof Error ? e.message : 'Non riesco a caricare la prova.'); }
    finally { this.busy.set(false); }
  }
  protected setCode(seat: 'A' | 'B', code: string): void { this.codes.update(c => ({...c,[seat]:code.replace(/[^1-8]/g,'')})); }
  protected async act(seat: 'A' | 'B', type: string, extra: Record<string, unknown> = {}): Promise<void> {
    if(this.busy() || !this.views()[seat]) return;
    this.busy.set(true); this.error.set('');
    try {
      const response = await fetch(this.url(seat), { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...extra,type,version:this.views()[seat]!.version,requestId:crypto.randomUUID()}) });
      const value = await response.json(); if(!response.ok) throw new Error(value.error);
      if (type !== 'ready') this.codes.set({A:'',B:''});
    } catch(e) { this.error.set(e instanceof Error ? e.message : 'Non riesco a fare questa mossa.'); }
    finally { await this.load(); }
  }
  protected async reset(): Promise<void> { await this.act('A','practice-reset'); }
}
