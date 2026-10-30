-- Voci storiche verificate singolarmente: titolo, testo e destinazione devono coincidere.
-- Le voci modificate o nuove mantengono la classificazione assegnata nell’editor.
UPDATE world_updates SET safe = 1
WHERE kind = 'mondo' AND safe = 0 AND (route, title, body) IN (
  ('/aula-studio', 'I quiz sono entrati nell’Aula studio', 'Ora puoi svolgere quiz completi, correggerli e ritrovare i tentativi precedenti.'),
  ('/aula-studio', 'Apre l’Aula studio', 'Argomenti, cartelle e flashcard entrano nel Mondo Bianco.'),
  ('/aula-studio', 'L’Aula accetta import completi', 'Flashcard e cartelle possono essere caricate insieme con un bulk strutturato.'),
  ('/aula-studio', 'I quiz diventano misti', 'Si possono estrarre domande da più unità e bilanciarle per difficoltà.'),
  ('/aula-studio', 'Gli import dello studio si possono annullare', 'La cronologia degli import mostra cosa è entrato e permette di ripristinare la situazione precedente.'),
  ('/tavolo-da-gioco/frequenze', 'Arriva il Marchingegno', 'Una scatola cooperativa da esplorare da dentro e da fuori si aggiunge alle prove a due.')
);
