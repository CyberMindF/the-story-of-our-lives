import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { IpdvNavigation } from '../../shared/ipdv-navigation/ipdv-navigation';
import { FormSubmission } from '../../shared/form-submission/form-submission';

const ADVENTURE = 'il-prezzo-della-verita';

interface Character {
  name: string;
  catName: string;
  description: string;
  statMente: number;
  statCuore: number;
  statCorpo: number;
  statMagia: number;
  stressCurrent: number;
  spellSlotsCurrent: number;
  inventory: string;
}

// Porting fedele di assets/js/gdr/maga.js: stesso endpoint (/api/gdr/character), stesso
// invio come FormData, stesso totale statistiche calcolato live (12 punti). I campi qui
// sono proprietà normali con [(ngModel)] invece di riletti dal DOM al submit — stesso
// risultato, binding dichiarativo invece di FormData letta da <form> per il calcolo del
// totale (il submit vero e proprio usa comunque FormData sul form reale, invariato).
@Component({
  selector: 'app-la-tua-maga',
  standalone: true,
  imports: [FormsModule, AppShell, IpdvNavigation],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './la-tua-maga.html'
})
export class LaTuaMaga implements OnInit {
  protected readonly submission = inject(FormSubmission);
  protected name = '';
  protected catName = '';
  protected description = '';
  protected statMente = 1;
  protected statCuore = 1;
  protected statCorpo = 1;
  protected statMagia = 1;
  protected stressCurrent = 10;
  protected spellSlotsCurrent = 3;
  protected inventory = '';

  protected readonly fieldsDisabled = signal(true);
  protected readonly statusMessage = signal('Sto caricando la scheda...');
  protected readonly statTotal = computed(() => this.statMente + this.statCuore + this.statCorpo + this.statMagia);

  async ngOnInit(): Promise<void> {
    await this.loadCharacter();
  }

  private async loadCharacter(): Promise<void> {
    this.fieldsDisabled.set(true);
    this.statusMessage.set('Sto caricando la scheda...');

    try {
      const response = await fetch(`/api/gdr/character?adventure=${ADVENTURE}`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { character: Character };
      const character = data.character;

      this.name = character.name;
      this.catName = character.catName;
      this.description = character.description;
      this.statMente = character.statMente;
      this.statCuore = character.statCuore;
      this.statCorpo = character.statCorpo;
      this.statMagia = character.statMagia;
      this.stressCurrent = character.stressCurrent;
      this.spellSlotsCurrent = character.spellSlotsCurrent;
      this.inventory = character.inventory;

      this.statusMessage.set('');
    } catch (error) {
      console.error('Errore nel caricamento della scheda:', error);
      this.statusMessage.set('Non è stato possibile caricare la scheda salvata.');
    } finally {
      this.fieldsDisabled.set(false);
    }
  }

  protected async saveCharacter(form: HTMLFormElement): Promise<void> {
    this.statusMessage.set('');
    await this.submission.submit(form, {
      url: '/api/gdr/character',
      pendingMessage: 'Sto salvando...',
      successMessage: 'Scheda salvata.',
      fallbackError: 'Salvataggio non riuscito.',
      prepareData: (data) => data.set('adventure', ADVENTURE),
      resetOnSuccess: false
    });
  }
}
