# Archivio frontend vanilla

Questa cartella conserva in modo reversibile il frontend HTML/JavaScript precedente alla
migrazione Angular. I file sono stati spostati qui durante la Fase 7: non devono essere
importati, serviti o copiati nell'output di produzione.

La struttura relativa originale e' stata mantenuta per rendere possibili confronti e
ripristini puntuali. Il frontend attivo vive in `../web/`; CSS, immagini, contenuti JSON e
Cloudflare Functions rimangono nelle rispettive cartelle della root perche' sono ancora usati.

Il confronto visuale/funzionale e il test locale della build pubblicabile sono completati.
L'archivio resta intenzionalmente disponibile fino al cutover Cloudflare e potra' essere
eliminato soltanto con un commit successivo e separato.
