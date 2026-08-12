import { Component, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

interface CodeEntry {
  symbol: string;
  meaning: string;
  explanation?: string;
}

interface CodeCategory {
  title: string;
  icon: string;
  note?: string;
  entries: CodeEntry[];
}

interface CodeExample {
  code: string;
  meaning: string;
}

// Pagina statica come Mappamondo: nessuna fonte dati esterna, la tabella è piccola e non
// cambia spesso — non vale la pena aggiungere un nuovo file di contenuto solo per questo.
@Component({
  selector: 'app-linguaggio-segreto',
  standalone: true,
  imports: [AppShell, EditorialText],
  styleUrls: ['../../../styles/pages/linguaggio-segreto.css'],
  templateUrl: './linguaggio-segreto.html'
})
export class LinguaggioSegreto {
  // Disposizione "rubrica": linguette laterali con le categorie, come un'agenda/indice
  // alfabetico — scelta dopo aver confrontato 4 alternative dal vivo (griglia, colonna
  // singola, fisarmonica, sfoglia).
  protected readonly activeCategoryIndex = signal(0);

  protected readonly categories: CodeCategory[] = [
    {
      title: 'Sentimenti',
      icon: '❤️',
      note: 'I puntini sono una scala: più ce ne metti, più cresce l’intensità. Il primo puntino da solo però è un caso a parte — è il gesto veloce che ci siamo sempre fatti, e a seconda del momento può voler dire anche “sono arrabbiato” o “via libera”, non solo “ti penso”.',
      entries: [
        { symbol: '.', meaning: 'Ti penso' },
        { symbol: '..', meaning: 'Messaggio ricevuto' },
        { symbol: '...', meaning: 'Mi manchi' },
        { symbol: '....', meaning: 'Ti voglio benissimo' },
        { symbol: '.....', meaning: 'Ti amo', explanation: 'Tempo fa il numero cinque ha rappresentato questo, era un po’ un linguaggio segreto ❤️❤️❤️❤️❤️' },
        { symbol: '- oppure +', meaning: 'Sto male / Sto bene', explanation: '“-” rappresenta la negatività, quindi sto male; “+” il contrario' },
        { symbol: '*', meaning: 'Bacino', explanation: 'Il bacino della classica faccina “:*”' },
        { symbol: '<>', meaning: 'Abbraccio', explanation: 'Sembrano le braccia chiuse dell’abbraccio' },
        { symbol: 'Z oppure Y', meaning: 'Buonanotte / Buongiorno', explanation: '“Z” è il diminutivo di “ZZZZ”, dormire; “Y” è un omino che si stiracchia' }
      ]
    },
    {
      title: 'Urgenza',
      icon: '❗',
      entries: [
        { symbol: '!', meaning: 'C’è un problema piccolo', explanation: 'Pericolo, urgenza, il classico punto esclamativo' },
        { symbol: '!!', meaning: 'C’è un problema grosso', explanation: 'Ancora più pericolo del singolo — in teoria potremmo mettercene quanti vogliamo, tipo dodici “!” sarebbe “super mega iper pericolo” ahaha' }
      ]
    },
    {
      title: 'Tempo',
      icon: '⏱️',
      entries: [
        { symbol: '|', meaning: 'Oggi / Adesso', explanation: 'Come un paletto piantato al centro, o una freccia verso il basso: “ora”' },
        { symbol: '> oppure <', meaning: 'Tra poco / Poco fa', explanation: 'Come nei tasti avanti/indietro di telecomandi o youtube “>” punta avanti nel tempo, tra poco; “<” punta indietro, poco fa' },
        { symbol: '>> oppure <<', meaning: 'Stasera / Stamattina', explanation: 'Doppio simbolo, un po’ più in là ma sempre nella giornata di oggi' },
        { symbol: '>>> oppure <<<', meaning: 'Domani / Ieri', explanation: 'Triplo simbolo, un giorno più in là' }
      ]
    },
    {
      title: 'Logistica',
      icon: '📍',
      entries: [
        { symbol: '#', meaning: 'Sono a casa', explanation: 'Somiglia a una struttura, una porta, o appunto un cancelletto' },
        { symbol: '@', meaning: 'Sono fuori / Luogo generico', explanation: 'Usata nel mondo informatico per “mandare le cose”, quindi “sono fuori”, rappresenta l’esterno' },
        { symbol: '0', meaning: 'Sono sul documento / Ti ho scritto' },
        { symbol: 'X', meaning: 'Sono impegnato/a', explanation: 'Come per dire negativo, non ci sono' }
      ]
    },
    {
      title: 'Sintassi',
      icon: '🔤',
      entries: [
        { symbol: '?', meaning: 'Domanda', explanation: 'Il classico punto di domanda, vuol dire esattamente questo' },
        { symbol: '/', meaning: 'No / Negazione', explanation: 'Come barrare una cosa e negarla' },
        { symbol: 'V', meaning: 'Sì / Affermazione', explanation: 'Come se fosse una spunta, è un sì' },
        { symbol: '&', meaning: 'Congiunzione', explanation: 'La “e commerciale”, che usiamo per non scrivere “E” ma è comunque una congiunzione' }
      ]
    },
    {
      title: 'Soggetti',
      icon: '👥',
      entries: [
        { symbol: '^', meaning: 'Un’altra persona', explanation: 'È come una freccia che indica da un’altra parte, quindi “qualcun altro”' },
        { symbol: '^^', meaning: 'Altre persone', explanation: 'Il plurale di “^”' }
      ]
    }
  ];

  // Esempi inventati da Rory (non frasi realmente scambiate) per mostrare come i simboli si
  // possano combinare in una frase, non solo cosa significano da soli — pensati per l'app di
  // notifiche (ntfy) descritta sopra, usata quando il documento condiviso era troppo lento.
  protected readonly examples: CodeExample[] = [
    { code: '>>', meaning: 'a stasera' },
    { code: '/ >>', meaning: 'stasera non posso o non ci sono' },
    { code: '/#', meaning: 'non sono a casa' },
    { code: '@?', meaning: 'dove sei?' },
    { code: '#^', meaning: 'a casa sua' },
    { code: '>>>?', meaning: 'domani ci sei?' },
    { code: 'V', meaning: 'sì' },
    { code: '| /#', meaning: 'oggi non sono a casa' },
    { code: '..', meaning: 'ok' },
    { code: '... <> & *', meaning: 'mi manchi, ti mando un abbraccio e un bacino' },
    { code: '0?', meaning: 'vieni sul documento?' },
    { code: '>>> 0', meaning: 'domani vengo sul documento' }
  ];
}
