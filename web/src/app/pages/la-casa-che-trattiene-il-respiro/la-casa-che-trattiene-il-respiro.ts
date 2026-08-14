import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { GdrBlocks } from '../../shared/gdr-blocks/gdr-blocks';
import { GdrDocumentEditor } from '../../shared/gdr-blocks/gdr-document-editor';
import { GdrBlockRow } from '../../shared/gdr-blocks/gdr-block.types';
import { GdrPanel } from '../../shared/gdr-panel/gdr-panel';
import { ApiService } from '../../core/api.service';

const ADVENTURE = 'la-casa-che-trattiene-il-respiro';

interface Turn {
  isMine: boolean;
  author: string;
  createdAt: string;
  body: string;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Seconda avventura GDR (#16): stesso schema di Avventura (blocchi narrativi statici + thread
// turni play-by-chat), ma con la scheda del personaggio/regole/appunti unificate nel pannello
// condiviso GdrPanel invece di tre pagine separate come "Il Prezzo della Verità" — qui non
// esiste una pagina "regole" a sé, il bottom sheet la sostituisce.
@Component({
  selector: 'app-la-casa-che-trattiene-il-respiro',
  standalone: true,
  imports: [AppShell, FormsModule, ContentMessage, GdrBlocks, GdrDocumentEditor, GdrPanel],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/tavolo.css'],
  templateUrl: './la-casa-che-trattiene-il-respiro.html'
})
export class LaCasaCheTrattieneIlRespiro implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly submission = inject(FormSubmission);
  protected readonly turns = signal<Turn[]>([]);
  protected readonly loadError = signal(false);
  protected readonly adventure = ADVENTURE;

  private readonly rawBlocks = signal<GdrBlockRow[]>([]);
  protected readonly narrativeBlocks = computed(() =>
    this.rawBlocks()
      .filter((block) => block.documentKey === 'casa-avventura')
      .sort((a, b) => a.position - b.position)
  );

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadTurns(), this.loadBlocks()]);
  }

  private async loadBlocks(): Promise<void> {
    try {
      const response = await fetch('/api/gdr-blocks', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ blocks?: GdrBlockRow[] }>(response);
      this.rawBlocks.set(result.blocks ?? []);
    } catch (error) {
      console.error("Errore nel caricamento del testo dell'avventura:", error);
    }
  }

  protected formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
  }

  private async loadTurns(): Promise<void> {
    try {
      const response = await fetch(`/api/gdr/turns?adventure=${ADVENTURE}`, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as { turns?: Turn[] };
      this.loadError.set(false);
      this.turns.set(data.turns || []);
    } catch (error) {
      console.error('Errore nel caricamento del turno:', error);
      this.loadError.set(true);
    }
  }

  protected async submitTurn(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/gdr/turns',
      pendingMessage: 'Sto inviando...',
      successMessage: '',
      prepareData: (data) => data.set('adventure', ADVENTURE),
      afterSuccess: () => this.loadTurns()
    });
  }
}
