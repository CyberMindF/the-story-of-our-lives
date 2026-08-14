export type WorldPlaceGroup = 'ricordi' | 'insieme' | 'giochi' | 'mondo';

export interface WorldPlace {
  id: string;
  emoji: string;
  route: string | null;
  fallbackName: string;
  fallbackDescription: string;
  group: WorldPlaceGroup;
  primary?: boolean;
  parentId?: string;
}

export const WORLD_PLACE_GROUPS: readonly { id: WorldPlaceGroup; label: string; description: string }[] = [
  { id: 'ricordi', label: 'Per ritrovare noi', description: 'Ricordi, parole e pezzi della nostra storia.' },
  { id: 'insieme', label: 'Per immaginare il dopo', description: 'Idee, mete e cose ancora da vivere.' },
  { id: 'giochi', label: 'Per giocare', description: 'Piccole sfide e avventure da attraversare insieme.' },
  { id: 'mondo', label: 'Per cambiare il mondo', description: 'Il cielo, il suo aspetto e gli spazi personali.' }
];

// Registro funzionale condiviso da home e atlante. Rotte, disponibilità e icone vivono qui;
// nomi e descrizioni delle destinazioni principali possono essere sovrascritti dal CMS.
export const WORLD_PLACES: readonly WorldPlace[] = [
  { id: 'bacheca', emoji: '📸', route: '/bacheca', fallbackName: 'La Bacheca dei Ricordi', fallbackDescription: 'Le fotografie, i video e i racconti dei giorni che abbiamo vissuto.', group: 'ricordi', primary: true },
  { id: 'mappamondo', emoji: '🌍', route: '/mappamondo', fallbackName: 'Il Mappamondo', fallbackDescription: 'La storia di come ho immaginato e costruito questo mondo per noi.', group: 'ricordi', primary: true },
  { id: 'ponti', emoji: '🌈', route: '/ponti', fallbackName: 'I Ponti', fallbackDescription: 'Le vecchie strade con cui ci siamo parlati e le lettere che le hanno attraversate.', group: 'ricordi', primary: true },
  { id: 'storie', emoji: '📖', route: '/storie', fallbackName: 'Le Storie', fallbackDescription: 'Racconti nostri, scritti per non lasciare andare quello che significano.', group: 'ricordi', primary: true },
  { id: 'calendario', emoji: '📅', route: '/calendario', fallbackName: 'Il Calendario', fallbackDescription: 'Le date che nel nostro mondo hanno un significato tutto loro.', group: 'ricordi', primary: true },
  { id: 'cuffiette', emoji: '🎧', route: '/cuffiette', fallbackName: 'Le Cuffiette', fallbackDescription: 'Le canzoni che parlano di noi o che abbiamo ascoltato insieme.', group: 'ricordi', primary: true },
  { id: 'lettere', emoji: '📫', route: '/lettere', fallbackName: 'La Cassetta delle Lettere', fallbackDescription: 'I messaggi che vogliamo lasciarci e rileggere con calma.', group: 'ricordi', primary: true },
  { id: 'domande', emoji: '⛲', route: '/domande', fallbackName: 'Il Pozzo dei Dubbi', fallbackDescription: 'Le domande che voglio farti e le risposte che vorrai lasciare.', group: 'ricordi', primary: true },
  { id: 'barattolo-dei-pensieri', emoji: '🫙', route: '/barattolo-dei-pensieri', fallbackName: 'Il Barattolo dei Pensieri', fallbackDescription: 'Piccoli biglietti da pescare, scritti l’uno per l’altra.', group: 'ricordi', primary: true },

  { id: 'mappa', emoji: '🗺️', route: '/mappa', fallbackName: 'La Mappa', fallbackDescription: 'I luoghi in cui siamo stati e quelli in cui vorremmo arrivare.', group: 'insieme', primary: true },
  { id: 'cose-da-fare-insieme', emoji: '📔', route: '/cose-da-fare-insieme', fallbackName: "L'Agenda delle Idee", fallbackDescription: 'La lista delle cose piccole e grandi che vogliamo fare insieme.', group: 'insieme', primary: true },
  { id: 'ricettario', emoji: '🍳', route: '/ricettario', fallbackName: 'Il Ricettario', fallbackDescription: 'Quello che abbiamo cucinato e quello che proveremo a preparare.', group: 'insieme', primary: true },
  { id: 'suggerimenti', emoji: '💭', route: '/suggerimenti', fallbackName: 'I Suggerimenti', fallbackDescription: 'Il posto in cui proporre qualcosa di nuovo per qualunque angolo del sito.', group: 'insieme' },

  { id: 'tavolo-da-gioco', emoji: '🎲', route: '/tavolo-da-gioco', fallbackName: 'Il Tavolo da Gioco', fallbackDescription: 'Il punto di partenza per cruciverba, giochi e avventure.', group: 'giochi', primary: true },
  { id: 'cruciverba', emoji: '🧩', route: '/tavolo-da-gioco/cruciverba', fallbackName: 'Il Cruciverba', fallbackDescription: 'Cento definizioni che raccontano qualcosa di noi.', group: 'giochi', parentId: 'tavolo-da-gioco' },
  { id: 'messaggio-criptato', emoji: '🔐', route: '/tavolo-da-gioco/messaggio-criptato', fallbackName: 'Il Messaggio Criptato', fallbackDescription: 'Un messaggio da ricostruire un indizio alla volta.', group: 'giochi', parentId: 'tavolo-da-gioco' },
  { id: 'gdr', emoji: '🗝️', route: '/tavolo-da-gioco/gdr', fallbackName: 'I Giochi di Ruolo', fallbackDescription: 'Qui trovi Il Prezzo della Verità; La casa che trattiene il respiro arriverà presto.', group: 'giochi', parentId: 'tavolo-da-gioco' },
  { id: 'prova-a-dire-no', emoji: '👀', route: '/tavolo-da-gioco/prova-a-dire-no', fallbackName: 'Prova a Dire No', fallbackDescription: 'Domande a cui non riuscirai a rispondere "no".', group: 'giochi', parentId: 'tavolo-da-gioco' },
  { id: 'linguaggio-segreto', emoji: '🔣', route: '/linguaggio-segreto', fallbackName: 'Il Linguaggio Segreto', fallbackDescription: 'I simboli e le parole che capiamo soltanto noi.', group: 'giochi' },

  { id: 'impostazioni-mondo', emoji: '🎛️', route: '/impostazioni-mondo', fallbackName: 'La Stanza dei Bottoni', fallbackDescription: 'Temi, cielo ed effetti con cui cambiare l’atmosfera del mondo.', group: 'mondo', primary: true },
  { id: 'il-cielo', emoji: '🌌', route: '/il-cielo', fallbackName: 'Il Cielo', fallbackDescription: 'Uno spazio quieto in cui guardare la luna di oggi.', group: 'mondo', primary: true },
  { id: 'profilo', emoji: '👤', route: '/profilo', fallbackName: 'Il Profilo', fallbackDescription: 'Le impostazioni personali e gli accessi alle aree riservate.', group: 'mondo' }
];
