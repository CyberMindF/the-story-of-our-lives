import { Component } from '@angular/core';
import { AppShell } from '../../shell/app-shell';

// Pagina statica come Mappamondo/Linguaggio Segreto. Il contenuto (blocchi AES + testo
// cifrato con sostituzione/Cesare) è stato estratto in modo programmatico dall'export
// Notion originale (cartella "Messaggio criptato/" alla radice del repo), non ritrascritto
// a mano — un cifrario si rompe con un solo carattere sbagliato. Verificato byte per byte
// prima di consegnare: tutti i blob AES e i 5 paragrafi cifrati coincidono esattamente
// con l'originale.
@Component({
  selector: 'app-messaggio-criptato',
  standalone: true,
  imports: [AppShell],
  styleUrls: ['../../../styles/pages/messaggio-criptato.css'],
  templateUrl: './messaggio-criptato.html'
})
export class MessaggioCriptato {}
