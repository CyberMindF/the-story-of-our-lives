import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GdrBlocks } from '../gdr-blocks/gdr-blocks';
import { GdrDocumentEditor } from '../gdr-blocks/gdr-document-editor';
import { GdrBlockRow, GdrDocumentKey } from '../gdr-blocks/gdr-block.types';
import { GdrNotesEditor } from '../gdr-notes/gdr-notes-editor';
import { ApiService } from '../../core/api.service';

export interface GdrStatConfig {
  key: string;
  label: string;
  min: number;
  max: number;
}

type GdrPanelTab = 'personaggio' | 'regole' | 'appunti';

// Pannello di gioco condiviso tra le avventure GDR: prima erano tre pagine separate ("La Tua
// Maga", regole, "I Tuoi Appunti"), qui diventano tab di un bottom sheet consultabile senza
// uscire dalla pagina dell'avventura. Scoped per avventura (adventure/rulesDocumentKey/
// statsConfig come @Input): ogni avventura ha personaggi e regole diversi, ma lo stesso
// meccanismo di apertura/tab/persistenza.
@Component({
  selector: 'app-gdr-panel',
  standalone: true,
  imports: [FormsModule, GdrBlocks, GdrDocumentEditor, GdrNotesEditor],
  templateUrl: './gdr-panel.html',
  styleUrl: './gdr-panel.css'
})
export class GdrPanel implements OnInit {
  @Input({ required: true }) adventure!: string;
  @Input({ required: true }) rulesDocumentKey!: GdrDocumentKey;
  @Input({ required: true }) statsConfig!: GdrStatConfig[];

  private readonly api = inject(ApiService);

  protected readonly open = signal(false);
  protected readonly activeTab = signal<GdrPanelTab>('personaggio');

  protected readonly statValues = signal<Record<string, number>>({});
  protected readonly statsLoading = signal(true);
  protected readonly statsStatus = signal('');

  private readonly rawBlocks = signal<GdrBlockRow[]>([]);
  protected readonly rulesBlocks = computed(() =>
    this.rawBlocks()
      .filter((block) => block.documentKey === this.rulesDocumentKey)
      .sort((a, b) => a.position - b.position)
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadStats(), this.loadRules()]);
  }

  protected togglePanel(): void {
    this.open.update((value) => !value);
  }

  protected closePanel(): void {
    this.open.set(false);
  }

  protected setTab(tab: GdrPanelTab): void {
    this.activeTab.set(tab);
  }

  private async loadStats(): Promise<void> {
    this.statsLoading.set(true);
    try {
      const response = await fetch(`/api/gdr/character-stats?adventure=${this.adventure}`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ stats?: Record<string, number> }>(response);
      this.statValues.set(result.stats ?? {});
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche del personaggio:', error);
    } finally {
      this.statsLoading.set(false);
    }
  }

  private async loadRules(): Promise<void> {
    try {
      const response = await fetch('/api/gdr-blocks', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ blocks?: GdrBlockRow[] }>(response);
      this.rawBlocks.set(result.blocks ?? []);
    } catch (error) {
      console.error('Errore nel caricamento delle regole:', error);
    }
  }

  protected async setStat(key: string, value: number): Promise<void> {
    this.statValues.update((values) => ({ ...values, [key]: value }));
    this.statsStatus.set('Sto salvando...');
    try {
      const formData = new FormData();
      formData.set('adventure', this.adventure);
      formData.set('statKey', key);
      formData.set('value', String(value));
      const response = await fetch('/api/gdr/character-stats', { method: 'POST', credentials: 'same-origin', body: formData });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      this.statsStatus.set('Salvato.');
    } catch (error) {
      console.error('Errore nel salvataggio della statistica:', error);
      this.statsStatus.set('Non è stato possibile salvare, riprova.');
    }
  }
}
