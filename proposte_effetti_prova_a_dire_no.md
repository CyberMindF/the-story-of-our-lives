# 35 Proposte di Effetti Inafferrabili per "Prova a Dire No" (#f4)

Raccolta di **35 comportamenti ed effetti diversi** per il bottone "No" (e altre opzioni evasive) nel gioco **"Prova a Dire No"** (`/tavolo-da-gioco/prova-a-dire-no`).

L'obiettivo del task `#f4` è garantire che **ogni domanda abbia un comportamento unico e sorprendente**, senza mai ripetere lo stesso trucco di fuga durante la partita.

---

## 📐 Struttura e Architettura Tecnica Conseguibile

Nel codice esistente (`web/src/app/pages/prova-a-dire-no/prova-a-dire-no.ts`), il tipo `EvasiveBehavior` supporta attualmente 4 comportamenti (`move`, `disappear`, `swap`, `grow`).
Estendendo `EvasiveBehavior` e la gestione nel template (`@switch (question.behavior)` o direttive CSS/Animation), ognuno di questi 35 effetti può essere associato in modo deterministico a una domanda specifica del gioco.

---

## 🚀 Categoria 1: Fuga Fisica & Dinamica Vettoriale

### 1. 🧲 La Calamita Invertita (Magnet Repulsion)
* **Come funziona**: Più il cursore/dito si avvicina al bottone "No", più il bottone subisce una forza di repulsione vettoriale proporzionale all'inverso della distanza (come due poli magnetici uguali). Non fa un salto istantaneo, ma scivola via con accelerazione e fluidità d'inerzia.
* **Esperienza UX**: Sembra di spingere una bolla magnetica invisible; il bottone sguscia via morbido lungo lo schermo.
* **Fattibilità**: Massima (calcolo coordinate 2D su `mousemove` / `pointermove` con accelerazione smoothing).

### 2. 🪐 L'Orbita Spaziale (Orbital Slingshot)
* **Come funziona**: Quando il puntatore entra nel raggio di ingaggio (es. 100px), il bottone "No" comincia a ruotare velocemente a 360° attorno al bottone "Sì" (o al centro dello schermo), agendo come un satellite inafferrabile che orbita senza fermarsi.
* **Esperienza UX**: Esilarante effetto fionda astronomica.
* **Fattibilità**: Alta (trasformazione `transform: rotate(...) translate(...)` via CSS o requestAnimationFrame).

### 3. 🏹 Effetto Fionda Elastica (Elastic Slingshot)
* **Come funziona**: Quando provi a toccare o trascinare il bottone "No", questo si allunga ed elastica nella direzione opposta (usando sfumature o SVG deformation) prima di scattare e schizzare via all'altro capo dello schermo con un feedback sonoro o di vibrazione Haptic.
* **Esperienza UX**: Sensazione fisica e tattile molto soddisfacente e giocosa.
* **Fattibilità**: Media/Alta (transizione CSS elastica `cubic-bezier(0.68, -0.55, 0.27, 1.55)`).

### 4. 🎰 Rimbalzo Pinball (Bouncing Flipper)
* **Come funziona**: Al primo tentativo di avvicinamento, il "No" entra in modalità pallina da flipper: si attiva una traiettoria diagonale continua che lo fa rimbalzare ad alta velocità contro i 4 bordi del contenitore senza mai fermarsi.
* **Esperienza UX**: Un classico stile salva-schermo del DVD o flipper arcade; impossibile da puntare!
* **Fattibilità**: Massima (loop di movimento vettoriale `dx/dy` invertito sulle collisioni dei bordi).

### 5. 🪂 Gravità e Caduta Libera (Ragdoll Drop)
* **Come funziona**: Appena il cursore/dito si avvicina, il "No" sgancia i suoi vincoli di posizione, "cade" verso il basso per gravità simulata, rimbalza 2 o 3 volte sul fondo dello schermo e si nasconde nell'angolo in basso.
* **Esperienza UX**: Sembra che il bottone sia caduto dal tavolo di gioco per la paura!
* **Fattibilità**: Alta (keyframe animazione CSS bounce / gravity fall).

---

## 🥸 Categoria 2: Inganni Visivi, Camouflage & Mimetismo

### 6. 🦎 Il Camaleonte Mimetico (Chameleon Fade)
* **Come funziona**: Man mano che il mouse/dito si avvicina, la trasparenza (`opacity`) del bottone "No" scende fino allo 0% abbinandosi al colore esatto dello sfondo della pagina, diventando completamente invisibile finché non ci si allontana di nuovo.
* **Esperienza UX**: "Ora mi vedi, ora non mi vedi!". Se provi a cliccarlo al cieco dove era prima, si è già spostato.
* **Fattibilità**: Massima (mappatura distanza -> `opacity: 0`).

### 7. 🕵️‍♂️ Lo Scambio di Etichetta Furtivo (Stealth Label Swap)
* **Come funziona**: Il bottone rimane perfettamente fermo. Tuttavia, nell'istante esatto in cui il mouse si trova a meno di 10px (o sul `pointerdown`), il testo dentro la pillola cambia in silenzio da "No" a "Sì!".
* **Esperienza UX**: credi di aver cliccato "No", ma scopri di aver appena premuto "Sì!".
* **Fattibilità**: Massima (sostituzione testo su prossimità/hover).

### 8. 🛡️ Lo Scudo di Forza (Forcefield Barrier)
* **Come funziona**: Quando ci si avvicina al "No", attorno al bottone appare un'aura sferica luminosa semi-trasparente (con effetto vetro/neon). La barriera blocca fisicamente l'ingresso del cursore o respinge il tocco touch con un piccolo rimbalzo "Bzz!".
* **Esperienza UX**: Sembra che il bottone si sia protetto con uno scudo fantascienza.
* **Fattibilità**: Alta (overlay pseudo-elemento `:before` / `:after` che intercetta i pointer events).

### 9. 👻 Il Miraggio dei Fantasmi (Ghosting Mirage)
* **Come funziona**: Avvicinandosi col mouse, il bottone si sdoppia visivamente in 5 copie fantasma sfocati ed eteree disposte in cerchio; soltanto 1 è reale, ma se sfiorata scompare e fa rimescolare le copie.
* **Esperienza UX**: Effetto illusione ottica dove bisogna indovinare il bottone vero (che comunque sguscia via!).
* **Fattibilità**: Alta (moltiplicazione visuale CSS `filter: drop-shadow` o cloni leggeri).

### 10. 🪆 La Matrioska Rimpicciolente (Micro-Button Shrink)
* **Come funziona**: A ogni tentativo di tocco/click, il bottone "No" si riduce del 50% di scala lasciando dietro di sé una traccia dell'originale, fino a diventare un puntino microscopico inafferrabile da 2px.
* **Esperienza UX**: Più provi a premerlo, più diventa piccolo finché serve una lente d'ingrandimento!
* **Fattibilità**: Massima (`transform: scale(...)` decrementale ad ogni tentativo).

---

## 👯‍♀️ Categoria 3: Moltiplicazione, Cloni & Caos

### 11. 👥 L'Invasione dei Cloni (Clone Multiplication)
* **Come funziona**: Sfiorare il "No" lo fa sdoppiare in 2, poi in 4, poi in 8 bottoni "No" sparsi su tutto lo schermo. Tuttavia, 7 sono cloni "fake" che scoppiano come bolle se toccati, e soltanto 1 è quello vero (che scappa a sua volta).
* **Esperienza UX**: Caos divertente a schermo intero!
* **Fattibilità**: Alta (generazione dinamica di un piccolo array di posizioni fake).

### 12. 🌧️ La Pioggia di "No" (Raining Buttons)
* **Come funziona**: Toccare il "No" scatena una pioggia di 15-20 bottoni "No" che cadono dall'alto verso il basso della schermata come coriandoli, rendendo impossibile distinguere ed agganciare quello originale.
* **Esperienza UX**: Un'esplosione visiva festosa e caotica.
* **Fattibilità**: Alta (riusando la stessa logica di caduta già presente nel sito per cuori/stelle).

### 13. 🧩 Il Labirinto di Bottoni Trabocchetto (Fake Button Grid)
* **Come funziona**: Lo schermo si riempie di 9 bottoni disposti a griglia, ma leggendo bene dicono tutti cose come: *"Sì!"*, *"Certamente Sì"*, *"Sì in incognito"*, *"Sì ma in arancione"*, *"Sì al 100%"*.
* **Esperienza UX**: Un trabocchetto linguistico esilarante!
* **Fattibilità**: Massima (render di un array di opzioni ingannevoli).

### 14. 🃏 Il Gioco delle Tre Carte (Shell Game Shuffle)
* **Come funziona**: Compaiono 3 bottoni identici in fila. Dopo 1 secondo iniziano a scambiarsi di posto velocissimamente a schermo. Alla fine del rimescolamento, scopri che tutti e 3 sono diventati "Sì!".
* **Esperienza UX**: Il classico gioco delle 3 carte da strada, ma con trucco finale assicurato.
* **Fattibilità**: Alta (animazione CSS position swap con flip finale).

### 15. 🪞 Il Cursore Finto / Decoy (Decoy Cursor Illusion)
* **Come funziona**: Avvicinandosi al "No", compare a schermo un secondo cursore/mano finta animata che afferra il bottone "No" e lo trascina via in un angolo prima che il tuo cursore reale possa raggiungerlo!
* **Esperienza UX**: Sensazione di "hey, qualcuno me lo sta rubando da sotto gli occhi!".
* **Fattibilità**: Media/Alta (icona cursore che segue un percorso SVG/CSS).

---

## 🫧 Categoria 4: Trasformazioni Morfiche & Animazioni

### 16. 🫧 La Bolla di Sapone (Soap Bubble Pop)
* **Come funziona**: Il bottone "No" assume lo stile visivo di una trasparente bolla di sapone iridescente. Provando a toccarlo o cliccarlo, fa "POP!" (effetto visivo di scoppio con micro-particelle) e riappare integro in un altro punto.
* **Esperienza UX**: Poeticamente intonato allo stile grafico del sito (come l'effetto bolle di Ocean).
* **Fattibilità**: Massima (animazione pop + respawn).

### 17. 🎈 Il Palloncino ad Elio (Helium Floating Balloon)
* **Come funziona**: Il bottone "No" ha un piccolo filo da palloncino sul fondo e galleggia lentamente verso l'alto dello schermo. Se provi a toccarlo, riceve una spinta verso l'alto ancora più veloce.
* **Esperienza UX**: Molto affine all'effetto palloncini (#f2 del piano di lavoro).
* **Fattibilità**: Massima (movimento verticale `translateY` ascendente).

### 18. 🧊 Saponetta Bagnata / Slime (Gelatinous Squish)
* **Come funziona**: Quando ci si avvicina col puntatore, il bottone si deforma (squish & stretch) visivamente come una gelatina o una saponetta bagnata, sfuggendo di lato con una sensazione di scivolamento.
* **Esperienza UX**: Animazione fluida stile squash & stretch dei cartoni animati.
* **Fattibilità**: Alta (transizioni CSS scaleX/scaleY deformanti).

### 19. 🔄 La Rotazione 3D Invertita (3D Card Flip)
* **Come funziona**: Sfiorando il bottone, questo ruota su se stesso sull'asse Y in 3D (flip card). Durante il giro di 180°, il retro della tessera rivela la scritta "Sì!", invertendo la tua scelta prima del click!
* **Esperienza UX**: Risultato 3D sorprendente e immediato.
* **Fattibilità**: Massima (`transform: rotateY(180deg)` con `transform-style: preserve-3d`).

### 20. 🛷 Il Binario Scorrevole (Zipper Rail Slider)
* **Come funziona**: Il "No" è vincolato a una linea/binario orizzontale o verticale. Se provi a cliccarlo, scivola a scatto super veloce all'estremità opposta del binario.
* **Esperienza UX**: Sembra una cerniera o uno slider che non vuole farsi posizionare su No.
* **Fattibilità**: Massima (vincolo traslazione su asse singolo X o Y).

---

## 🎭 Categoria 5: Trolling Emotivo & Mischief UI

### 21. 🎭 Il Bottone Permoloso / Drama Queen (Offended Button)
* **Come funziona**: A ogni tentativo di click, il bottone cambia testo e stato d'animo:
  1. *"Ehi! Fai piano... 🥺"*
  2. *"Ma davvero vuoi dirmi di no?!"*
  3. *"Mi stai spezzando il cuore..."*
  4. *"Ok, mi sono offeso, me ne vado! 😤"* (scompare uscendo dallo schermo).
* **Esperienza UX**: Narrativa divertente e dialogata direttamente dentro il bottone.
* **Fattibilità**: Massima (array di frasi sequenziali ad ogni tentativo).

### 22. 🕳️ Il Portale Teletrasporto (Wormhole Teleport)
* **Come funziona**: Avvicinandosi al "No", si apre un piccolo vortice/portale viola ruotante sopra il bottone. Il "No" viene risucchiato dentro ed esce simultaneamente da un portale gemello aperto in un'altra parte dello schermo.
* **Esperienza UX**: Effetto Sci-Fi molto scenografico e divertente.
* **Fattibilità**: Alta (keyframe SVG/CSS portale + coordinate respawn).

### 23. ⚠️ La Finta Modale di Errore (Fake System Error Alert)
* **Come funziona**: Cliccando "No", invece di procedere appare una finta finestra di sistema (stile retrò o moderna del sito) che dice: *"Errore 404: La risposta NO è temporaneamente fuori servizio. Scegli SÌ per continuare."* con un unico tasto *"Capito (Sì)"*.
* **Esperienza UX**: Rompe la quarta parete con ironia geek/romantica.
* **Fattibilità**: Massima (stato booleano per dialog/modal).

### 24. 🪞 Il Cursore Invertito / Specchio (Inverted Pointer Physics)
* **Come funziona**: Quando il cursore entra nella zona d'azione attorno al "No", il bottone si muove in direzione esattamente speculare e opposta al movimento della tua mano (se scendi lui sale, se vai a destra lui va a sinistra).
* **Esperienza UX**: Un test di riflessi dove il bottone sembra il tuo riflesso allo specchio!
* **Fattibilità**: Massima (specchiamento coordinate `deltaX`, `deltaY`).

### 25. 🧩 Frammentazione in Lettere (Letter Breakup)
* **Come funziona**: Sfiorando il bottone "No", la pillola si rompe in due pezzi: la lettera **"N"** vola in alto a sinistra e la **"O"** vola in basso a destra. Non esiste più un bottone intero da poter premere!
* **Esperienza UX**: Disintegrazione fisica del bottone super inattesa.
* **Fattibilità**: Alta (due span separati per 'N' e 'O' animati con CSS translate).

---

## 🎮 Categoria 6: Mini-Giochi & Sfide Interattive

### 26. 🥊 Acchiappa la Talpa (Whack-a-Mole Button)
* **Come funziona**: Il "No" sprofonda sotto la superficie della pagina e ricompare per 0.5 secondi da uno dei 4 "buchi" disposti a quadrato, per poi re-inabissarsi subito se non si è iper-veloci.
* **Esperienza UX**: Meccanica arcade ritmata e frenetica.
* **Fattibilità**: Media/Alta (timer intervallo su 4 posizioni prefissate).

### 27. 🟡 Pac-Man Mangiottone (Hungry Yes Button)
* **Come funziona**: Quando l'utente tentenna sul "No", il bottone "Sì" a fianco apre una "bocca" animata tipo Pac-Man, cammina lungo lo schermo verso il "No", lo inghiotte in un boccone e torna al suo posto trionfante!
* **Esperienza UX**: Spettacolo animato esilarante dove è il "Sì" stesso a difendersi!
* **Fattibilità**: Alta (animazione keyframe CSS sequenziale con clip-path).

### 28. 🎡 La Ruota della Fortuna / Slot Machine (Spinning Wheel)
* **Come funziona**: Il "No" è montato su un rullo da Slot Machine. Provando a puntarlo, il rullo inizia a girare velocissimo mostrando altre scritte (*"Forse"*, *"Dimmi di Sì"*, *"Assolutamente Sì"*, *"Ovvio!"*) fermandosi sempre su una variante di Sì.
* **Esperienza UX**: Sensazione da casinò divertente e colorata.
* **Fattibilità**: Alta (animazione CSS `translateY` verticale a loop).

### 29. 🌌 Il Buco Nero Gravitazionale (Black Hole Fusion)
* **Come funziona**: Il bottone "Sì" emette impulsi gravitazionali (cerchi concentrici stile onde). Il bottone "No" viene inesorabilmente attirato verso il centro del "Sì" finché i due si fondono insieme in un unico grande "Sì super luminoso".
* **Esperienza UX**: Fusione cosmica di bottoni in puro stile *Mondo Bianco*.
* **Fattibilità**: Alta (interpolazione coordinate da `No` a `Yes`).

### 30. ⌛ Il Finto Caricamento Infinito (Infinite Spinner Converter)
* **Come funziona**: Se si riesce miracolosamente a cliccare "No", compare uno spinner di caricamento con la scritta: *"Verifica risposta in corso..."*. Dopo 2 secondi di attesa finta, lo spinner mostra un check verde: *"Risposta convertita in SÌ con successo! ❤️"*.
* **Esperienza UX**: Trolling psicologico perfetto con lieto fine.
* **Fattibilità**: Massima (timer setTimeout + cambio stato visuale).

---

## 🌟 Categoria Bonus Extra (Proposte 31-35)

### 31. 🌬️ La Spinta del Vento (Wind Blow Physics)
* **Come funziona**: Spostando il mouse velocemente verso il bottone, il movimento genera una folata di vento visiva (piccole linee bianche di scia) che soffia via il bottone nella direzione in cui sta correndo il mouse.
* **Esperienza UX**: Sembra di soffiare via un foglietto leggero sul tavolo.
* **Fattibilità**: Media/Alta (calcolo velocità e direzione cursore).

### 32. 📦 La Scatola a Sorpresa (Jack-in-the-Box)
* **Come funziona**: Il "No" si chiude dentro una scatolina regalo con molla. Se la tocchi, la scatola scatta e salta fuori un pupazzetto/cuore con un cartellino "Ha vinto il Sì!".
* **Esperienza UX**: Sorpresa visiva giocosa stile giocattolo d'epoca.
* **Fattibilità**: Alta (animazione CSS pop-up da container).

### 33. 🌋 Cursore Incandescente / Esplosione di Coriandoli (Heat Pressure Pop)
* **Come funziona**: Più mantieni il cursore/dito vicino al bottone "No", più il bottone accumula "calore" (diventa rosso incandescente con tremolio CSS), finché non scoppia in innocui coriandoli colorati e scompare.
* **Esperienza UX**: Tensione crescente sfociata in una festa visiva.
* **Fattibilità**: Alta (timer prossimità + classe CSS heating).

### 34. 🪢 Il Nodo Scorsoio / Elastico che Tira (Bungee Cord Pull)
* **Come funziona**: Il bottone "No" è collegato con un filo elastico visibile al bottone "Sì". Se provi a tirare il "No" lontano, l'elastico si tende e poi lo richiama indietro facendolo scontrare e fondere col "Sì".
* **Esperienza UX**: Fisica elastica molto divertente su touch mobile.
* **Fattibilità**: Media/Alta (SVG line elastica aggiornata in coordinate).

### 35. 🧭 La Fuga della Bussola (Compass Rose Escape)
* **Come funziona**: Lo schermo viene diviso idealmente nei 4 punti cardinali (Nord, Sud, Est, Ovest). Il "No" rileva da quale quadrante proviene la tua mano o il tuo cursore e scappa sempre nell'angolo diametralmente opposto.
* **Esperienza UX**: Logica deterministica dove il bottone evita sempre la traiettoria di provenienza.
* **Fattibilità**: Massima (calcolo angolare quadrantale).

---

## 📋 Tabella Riassuntiva delle 35 Proposte

| # | Nome Effetto | Categoria | Tipo Interazione | Complessità Implementation |
|---|---|---|---|---|
| 1 | 🧲 Calamita Invertita | Fuga Fisica | Mouse / Touch Prossimità | Bassa |
| 2 | 🪐 L'Orbita Spaziale | Fuga Fisica | Rotazione Continuata | Media |
| 3 | 🏹 Fionda Elastica | Fuga Fisica | Drag / Pointerdown | Media |
| 4 | 🎰 Rimbalzo Pinball | Fuga Fisica | Movimento Autonomo | Bassa |
| 5 | 🪂 Gravità & Caduta | Fuga Fisica | Keyframe Gravity | Bassa |
| 6 | 🦎 Il Camaleonte | Inganni Visivi | Distanza -> Opacity | Bassa |
| 7 | 🕵️‍♂️ Scambio Etichetta | Inganni Visivi | Text Replacement | Bassa |
| 8 | 🛡️ Scudo di Forza | Inganni Visivi | Pointer-events Shield | Media |
| 9 | 👻 Miraggio Fantasmi | Inganni Visivi | Visual Clones | Media |
| 10 | 🪆 La Matrioska | Inganni Visivi | Scale Decrement | Bassa |
| 11 | 👥 Invasione dei Cloni | Moltiplicazione | Array Spawn Fake | Media |
| 12 | 🌧️ Pioggia di No | Moltiplicazione | Particle System | Media |
| 13 | 🧩 Labirinto Trabocchetto | Moltiplicazione | Grid options | Bassa |
| 14 | 🃏 Gioco delle 3 Carte | Moltiplicazione | Swap Animation | Media |
| 15 | 🪞 Cursore Decoy | Moltiplicazione | SVG Path Follower | Alta |
| 16 | 🫧 Bolla di Sapone | Trasformazioni | Pop & Respawn | Bassa |
| 17 | 🎈 Palloncino ad Elio | Trasformazioni | Vertical Float | Bassa |
| 18 | 🧊 Saponetta Bagnata | Trasformazioni | Squash & Stretch | Bassa |
| 19 | 🔄 Rotazione 3D | Trasformazioni | 3D Flip Card | Bassa |
| 20 | 🛷 Binario Scorrevole | Trasformazioni | Single Axis Slide | Bassa |
| 21 | 🎭 Drama Queen | Trolling Emotivo | Sequential Text | Bassa |
| 22 | 🕳️ Portale Teletrasporto | Trolling Emotivo | Portal Animation | Media |
| 23 | ⚠️ Finta Modale Errore | Trolling Emotivo | Dialog Component | Bassa |
| 24 | 🪞 Cursore Invertito | Trolling Emotivo | Inverted Delta Math | Bassa |
| 25 | 🧩 Frammentazione | Trolling Emotivo | Split Text Spans | Media |
| 26 | 🥊 Acchiappa la Talpa | Mini-Giochi | Interval Respawn | Media |
| 27 | 🟡 Pac-Man Mangiottone | Mini-Giochi | Custom Keyframe AI | Alta |
| 28 | 🎡 Ruota della Fortuna | Mini-Giochi | Slot Reel Animation | Media |
| 29 | 🌌 Buco Nero Gravitazionale | Mini-Giochi | Vector Interpolation | Media |
| 30 | ⌛ Finto Caricamento | Mini-Giochi | Async State Delay | Bassa |
| 31 | 🌬️ Spinta del Vento | Bonus Extra | Velocity Vectors | Media |
| 32 | 📦 Scatola a Sorpresa | Bonus Extra | Spring Pop Container | Media |
| 33 | 🌋 Cursore Incandescente | Bonus Extra | Proximity Heat Timer | Media |
| 34 | 🪢 Nodo Scorsoio | Bonus Extra | SVG Bungee Line | Alta |
| 35 | 🧭 Fuga della Bussola | Bonus Extra | Angle Quadrant Math | Bassa |

---

## 📌 Prossimi Passi Consigliati per l'Implementazione

1. **Selezione degli 8-12 effetti preferiti** da assegnare alle domande correnti di *Prova a dire no*.
2. **Refactoring di `EvasiveBehavior`**:
   Estendere l'unione dei tipi in `prova-a-dire-no.ts` per includere i nuovi identifcatori (es. `'magnet'`, `'orbit'`, `'chameleon'`, `'drama'`, `'pacman'`, `'bubble'`, etc.).
3. **Mappatura 1-a-1 sulle domande**:
   Assicurare che ogni domanda dell'array `QUESTIONS` abbia un `behavior` unico, risolvendo definitivamente l'esigenza espressa nella scheda `#f4`.
