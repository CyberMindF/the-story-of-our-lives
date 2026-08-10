import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';

interface CodeEntry {
  symbol: string;
  meaning: string;
}

interface CodeCategory {
  title: string;
  entries: CodeEntry[];
}

// Pagina statica come Mappamondo: nessuna fonte dati esterna, la tabella è piccola e non
// cambia spesso — non vale la pena aggiungere un nuovo file di contenuto solo per questo.
@Component({
  selector: 'app-linguaggio-segreto',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/linguaggio-segreto.css'],
  templateUrl: './linguaggio-segreto.html'
})
export class LinguaggioSegreto {
  protected readonly categories: CodeCategory[] = [
    {
      title: 'Sentimenti',
      entries: [
        { symbol: '.', meaning: 'Ti penso' },
        { symbol: '..', meaning: 'Messaggio ricevuto' },
        { symbol: '...', meaning: 'Mi manchi' },
        { symbol: '....', meaning: 'Ti voglio benissimo' },
        { symbol: '- oppure +', meaning: 'Sto male / Sto bene' },
        { symbol: '*', meaning: 'Bacino' },
        { symbol: '<>', meaning: 'Abbraccio' },
        { symbol: 'Z oppure Y', meaning: 'Buonanotte / Buongiorno' }
      ]
    },
    {
      title: 'Urgenza',
      entries: [
        { symbol: '!', meaning: 'C’è un problema piccolo' },
        { symbol: '!!', meaning: 'C’è un problema grosso' }
      ]
    },
    {
      title: 'Tempo',
      entries: [
        { symbol: '|', meaning: 'Oggi / Adesso' },
        { symbol: '> oppure <', meaning: 'Tra poco / Poco fa' },
        { symbol: '>> oppure <<', meaning: 'Stasera / Stamattina' },
        { symbol: '>>> oppure <<<', meaning: 'Domani / Ieri' }
      ]
    },
    {
      title: 'Logistica',
      entries: [
        { symbol: '#', meaning: 'Sono a casa' },
        { symbol: '@', meaning: 'Sono fuori / Luogo generico' },
        { symbol: '0', meaning: 'Sono sul documento' },
        { symbol: 'X', meaning: 'Sono impegnato/a' }
      ]
    },
    {
      title: 'Sintassi',
      entries: [
        { symbol: '?', meaning: 'Domanda' },
        { symbol: '/', meaning: 'No / Negazione' },
        { symbol: 'V', meaning: 'Sì' },
        { symbol: '&', meaning: 'Congiunzione' }
      ]
    },
    {
      title: 'Soggetti',
      entries: [
        { symbol: '^', meaning: 'Un’altra persona' },
        { symbol: '^^', meaning: 'Altre persone' }
      ]
    }
  ];
}
