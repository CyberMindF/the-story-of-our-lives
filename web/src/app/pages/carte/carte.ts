import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { AuthService, UserIdentity } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { CarteBustineService } from '../../core/carte-bustine.service';
import { CartaTilt } from '../../shared/carta-tilt/carta-tilt';
import { CARTA_FINITURE, CARTA_FINITURA_LABELS, CartaFinitura } from '../../shared/carta-finiture';
import { CartaBack } from '../../shared/carta-back/carta-back';
import { CartaPack } from '../../shared/carta-pack/carta-pack';
import { CartaAlbumPicker, CartaAlbumPickerItem } from '../../shared/carta-album-picker/carta-album-picker';

// Stessa formula di streakDayBonus() in functions/api/carte-bustine/_shared.js — qui serve solo
// per disegnare il calendario, il bonus vero lo assegna sempre il server. Ogni giorno dà
// bustine, l'importo cresce di 1 ogni 3 giorni (1-3→+1, 4-6→+2, 7-9→+3, ...), senza tetto.
function streakDayBonus(day: number): number {
  return Math.floor((day - 1) / 3) + 1;
}

type Finitura = CartaFinitura;
type Tab = 'album' | 'scambi' | 'editor';
type TradeStato = 'proposto' | 'accettato' | 'rifiutato' | 'controproposto';

interface CartaPescata {
  id: string;
  finitura: Finitura;
  designId: string;
  designNome: string;
  immagineKey: string | null;
}

interface CartaCollezione {
  definizioneId: string | null;
  finitura: Finitura;
  designId: string;
  designNome: string;
  setId: string;
  setNome: string;
  immagineKey: string | null;
  quantitaMia: number;
  quantitaAltro: number;
}

interface TradeItem {
  carteDefinizioneId: string;
  finitura: Finitura;
  designId: string;
  designNome: string;
  immagineKey: string | null;
  quantita: number;
}

interface Trade {
  id: string;
  proponenteIdentity: UserIdentity;
  destinatarioIdentity: UserIdentity;
  stato: TradeStato;
  messaggio: string | null;
  tradePrecedenteId: string | null;
  createdAt: string;
  risoltoAt: string | null;
  offerta: TradeItem[];
  richiesta: TradeItem[];
}

interface CartaSet {
  id: string;
  slug: string;
  nome: string;
  descrizione: string | null;
  position: number;
}

interface CartaDesign {
  id: string;
  setId: string;
  nome: string;
  immagineKey: string | null;
  position: number;
}

const IDENTITY_LABELS: Record<UserIdentity, string> = { lui: 'lui', lei: 'lei' };

// Route + card di #e4 (gioco di carte collezionabili) — vedi documentazione/e4-carte-collezionabili.md per il
// design completo. Un'unica pagina a tab (Bustina/Album/Scambi/+Editor per l'admin) invece di
// route separate: stesso principio già usato dal pannello GDR, evita di duplicare shell/hero
// per una feature che è concettualmente un solo posto. L'editor è inline dietro canEdit(),
// non su una route admin dedicata (pattern dominante nel sito, vedi Barattolo dei Pensieri).
@Component({
  selector: 'app-carte',
  standalone: true,
  imports: [AppShell, FormsModule, CartaTilt, CartaBack, CartaPack, CartaAlbumPicker],
  styleUrls: ['../../../styles/components/modal.css', '../../../styles/pages/carte.css'],
  templateUrl: './carte.html'
})
export class Carte implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly carteBustineService = inject(CarteBustineService);

  protected readonly ownIdentity = computed<UserIdentity>(() => this.authService.currentUser()?.identity ?? 'lei');
  protected readonly otherIdentity = computed<UserIdentity>(() => (this.ownIdentity() === 'lui' ? 'lei' : 'lui'));
  protected readonly ownLabel = computed(() => IDENTITY_LABELS[this.ownIdentity()]);
  protected readonly otherLabel = computed(() => IDENTITY_LABELS[this.otherIdentity()]);
  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  protected readonly tab = signal<Tab>('album');

  // --- Bustina ---
  protected readonly bustineDisponibili = signal(0);
  protected readonly bustineLoadError = signal(false);
  protected readonly streakCorrente = signal(0);
  protected readonly streakMigliore = signal(0);
  protected readonly streakBonusOttenuto = signal(0);
  // Aperto in automatico solo alla prima visita della giornata (streakPrimaVisitaOggi dal
  // server), ma riapribile in ogni momento cliccando il badge 🔥 — i dati mostrati
  // (streakCorrente/streakBonusOttenuto) restano quelli sopra, nessuna duplicazione di stato.
  protected readonly streakModalOpen = signal(false);
  // Calendario premi tipo "login giornaliero" dei giochi mobile: una casella per ciascuno dei
  // 30 giorni. Ogni giorno dà un bonus (non solo alcune soglie) — rivisto il 15/08/2026.
  protected readonly streakDays = Array.from({ length: 30 }, (_, i) => {
    const giorno = i + 1;
    return { giorno, bonus: streakDayBonus(giorno) };
  });
  protected readonly opening = signal(false);
  protected readonly openError = signal('');
  protected readonly carteAperte = signal<CartaPescata[] | null>(null);
  // Quante carte sono già state "girate" e messe in riga dietro: 0 = solo la prima carta in
  // primo piano, nessuna ancora in fila. Quando arriva a carteAperte().length, tutte le carte
  // sono in riga e il pulsante "Avanti" diventa "Chiudi" — svelamento una alla volta invece di
  // una griglia con tutte le carte già scoperte, richiesto esplicitamente da Rory.
  protected readonly cartaRivelataIndex = signal(0);
  protected readonly animazioneBustina = signal(false);
  protected readonly cartaInPromozione = signal(false);
  private animazioneBustinaTimer?: ReturnType<typeof setTimeout>;
  // La carta corrente entra sempre coperta: il retro e' universale e non anticipa la
  // finitura. Dopo "Rivela" resta visibile il fronte; il click successivo passa alla carta
  // seguente, nuovamente coperta.
  protected readonly cartaInEvidenzaCoperta = signal(true);

  // Carta mostrata in grande al centro (quella non ancora in riga); null quando sono già
  // state rivelate tutte.
  protected readonly cartaInEvidenza = computed(() => {
    const carte = this.carteAperte();
    const i = this.cartaRivelataIndex();
    return carte && i < carte.length ? carte[i] : null;
  });

  // Le carte già "girate", nell'ordine in cui sono state rivelate.
  protected readonly carteInRiga = computed(() => {
    const carte = this.carteAperte();
    return carte ? carte.slice(0, this.cartaRivelataIndex()) : [];
  });

  // Carte ancora dentro il mazzetto sotto la carta grande. La carta corrente e' gia' stata
  // promossa al centro, quindi il mazzo parte dall'elemento successivo.
  protected readonly carteAncoraCoperte = computed(() => {
    const carte = this.carteAperte();
    return carte ? carte.slice(this.cartaRivelataIndex() + 1) : [];
  });

  // Vista a schermo intero di una singola carta (click su uno slot dell'album): stessa
  // finitura/immagine, solo più grande, per vedere davvero il foil che a dimensione slot è
  // troppo piccolo per giudicare (richiesta esplicita di Rory dopo aver visto l'album).
  protected readonly cartaIngrandita = signal<{ finitura: Finitura; immagineUrl: string | null; nome: string } | null>(null);
  protected readonly cartaIngranditaGirata = signal(false);

  // --- Album ---
  protected readonly collezione = signal<CartaCollezione[]>([]);
  protected readonly albumLoadError = signal(false);
  protected readonly finituraAttiva = signal<Finitura>('flat');
  protected readonly finiture = CARTA_FINITURE;
  protected readonly finituraLabels = CARTA_FINITURA_LABELS;

  protected readonly fogli = computed(() => {
    const finitura = this.finituraAttiva();
    const bySet = new Map<string, { setNome: string; carte: CartaCollezione[] }>();
    for (const carta of this.collezione()) {
      if (carta.finitura !== finitura) continue;
      if (!bySet.has(carta.setId)) bySet.set(carta.setId, { setNome: carta.setNome, carte: [] });
      bySet.get(carta.setId)!.carte.push(carta);
    }
    return [...bySet.values()];
  });

  // Carte possedute (quantità mia > 0), per i selettori di offerta nella proposta di trade.
  protected readonly carteMiePossedute = computed(() => this.collezione().filter((c) => c.quantitaMia > 0));
  protected readonly carteAltroPossedute = computed(() => this.collezione().filter((c) => c.quantitaAltro > 0));
  protected readonly carteMiePicker = computed<CartaAlbumPickerItem[]>(() => this.carteMiePossedute().map((carta) => ({
    id: carta.definizioneId ?? '',
    nome: carta.designNome,
    finitura: carta.finitura,
    immagineUrl: this.immagineUrl(carta.immagineKey),
    quantita: carta.quantitaMia
  })));
  protected readonly carteAltroPicker = computed<CartaAlbumPickerItem[]>(() => this.carteAltroPossedute().map((carta) => ({
    id: carta.definizioneId ?? '',
    nome: carta.designNome,
    finitura: carta.finitura,
    immagineUrl: this.immagineUrl(carta.immagineKey),
    quantita: carta.quantitaAltro
  })));

  // --- Scambi ---
  protected readonly trades = signal<Trade[]>([]);
  protected readonly tradesLoadError = signal(false);
  protected readonly tradesInSospeso = computed(
    () => this.trades().filter((t) => t.stato === 'proposto' && t.destinatarioIdentity === this.ownIdentity()).length
  );

  protected readonly nuovaOffertaId = signal('');
  protected readonly nuovaOffertaQuantita = signal(1);
  protected readonly nuovaRichiestaId = signal('');
  protected readonly nuovaRichiestaQuantita = signal(1);
  protected readonly nuovoMessaggio = signal('');
  protected readonly offertaBozza = signal<{ carteDefinizioneId: string; quantita: number }[]>([]);
  protected readonly richiestaBozza = signal<{ carteDefinizioneId: string; quantita: number }[]>([]);
  protected readonly proponendo = signal(false);
  protected readonly tradeError = signal('');

  // --- Editor admin ---
  protected readonly sets = signal<CartaSet[]>([]);
  protected readonly designs = signal<CartaDesign[]>([]);
  protected readonly editorLoadError = signal(false);
  protected readonly nuovoSetNome = signal('');
  protected readonly nuovoSetDescrizione = signal('');
  protected readonly nuovoDesignSetId = signal('');
  protected readonly nuovoDesignNome = signal('');
  protected readonly nuovoDesignFile = signal<File | null>(null);
  protected readonly uploadingDesign = signal(false);
  protected readonly editorError = signal('');

  protected readonly designsBySet = computed(() => {
    const groups = new Map<string, CartaDesign[]>();
    for (const design of this.designs()) {
      if (!groups.has(design.setId)) groups.set(design.setId, []);
      groups.get(design.setId)!.push(design);
    }
    return groups;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadBustine(), this.loadCollezione(), this.loadTrades()]);
    if (this.canEdit()) {
      await this.loadEditorData();
    }
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
  }

  protected apriStreakModal(): void {
    this.streakModalOpen.set(true);
  }

  protected chiudiStreakModal(): void {
    this.streakModalOpen.set(false);
  }

  protected onStreakModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.chiudiStreakModal();
  }

  // --- Bustina ---
  private async loadBustine(): Promise<void> {
    try {
      const userId = this.authService.currentUser()?.id;
      if (userId === undefined) throw new Error('Utente non disponibile.');
      // Se l'accesso è appena avvenuto riusa la risposta globale; tornando qui più tardi
      // aggiorna invece anche le bustine maturate nel frattempo.
      const data = await this.carteBustineService.load(userId, 5000);
      this.bustineDisponibili.set(data.quantitaDisponibile);
      this.streakCorrente.set(data.streakCorrente);
      this.streakMigliore.set(data.streakMigliore);
      this.streakBonusOttenuto.set(data.streakBustineBonus);
      if (data.streakPrimaVisitaOggi) {
        this.streakModalOpen.set(true);
      }
    } catch (error) {
      console.error('Errore nel caricamento delle bustine:', error);
      this.bustineLoadError.set(true);
    }
  }

  protected async apriBustina(): Promise<void> {
    if (this.opening() || this.bustineDisponibili() < 1) return;
    this.opening.set(true);
    this.openError.set('');

    try {
      const response = await fetch('/api/carte-bustine/apri', { method: 'POST', credentials: 'same-origin' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Non è stato possibile aprire la bustina.');
      }

      this.cartaRivelataIndex.set(0);
      this.cartaInEvidenzaCoperta.set(true);
      this.avviaAnimazioneBustina();
      this.carteAperte.set(result.carte ?? []);
      this.bustineDisponibili.set(result.quantitaDisponibile ?? 0);
      this.carteBustineService.invalidate();
      await this.loadCollezione();
    } catch (error) {
      this.openError.set(error instanceof Error ? error.message : 'Non è stato possibile aprire la bustina.');
    } finally {
      this.opening.set(false);
    }
  }

  // "Avanti": se c'è ancora una carta in primo piano la gira e la manda in riga; se erano
  // già tutte in riga (niente più da girare), lo stesso pulsante chiude il riepilogo.
  protected avantiReveal(): void {
    if (this.cartaInEvidenza()) {
      if (this.cartaInEvidenzaCoperta()) {
        this.cartaInEvidenzaCoperta.set(false);
      } else {
        this.cartaInPromozione.set(false);
        this.cartaRivelataIndex.update((i) => i + 1);
        this.cartaInEvidenzaCoperta.set(true);
        requestAnimationFrame(() => this.cartaInPromozione.set(true));
      }
    } else {
      this.chiudiReveal();
    }
  }

  // Salta l'apertura una alla volta: manda subito tutte le carte in riga, come chiedere di
  // "aprire direttamente" invece di premere avanti ripetutamente.
  protected apriTutteVeloce(): void {
    this.cartaRivelataIndex.set(this.carteAperte()?.length ?? 0);
  }

  protected chiudiReveal(): void {
    if (this.animazioneBustinaTimer) clearTimeout(this.animazioneBustinaTimer);
    this.animazioneBustinaTimer = undefined;
    this.animazioneBustina.set(false);
    this.cartaInPromozione.set(false);
    this.carteAperte.set(null);
    this.cartaRivelataIndex.set(0);
    this.cartaInEvidenzaCoperta.set(true);
  }

  private avviaAnimazioneBustina(): void {
    if (this.animazioneBustinaTimer) clearTimeout(this.animazioneBustinaTimer);
    this.animazioneBustina.set(true);
    this.cartaInPromozione.set(false);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animazioneBustinaTimer = setTimeout(() => {
      this.animazioneBustina.set(false);
      this.cartaInPromozione.set(true);
      this.animazioneBustinaTimer = undefined;
    }, reduceMotion ? 80 : 1850);
  }

  ngOnDestroy(): void {
    if (this.animazioneBustinaTimer) clearTimeout(this.animazioneBustinaTimer);
  }

  protected onModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.chiudiReveal();
  }

  protected immagineUrl(key: string | null): string | null {
    return key ? `/api/media/${key}` : null;
  }

  // --- Album ---
  private async loadCollezione(): Promise<void> {
    try {
      const response = await fetch('/api/carte-collezione', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = (await response.json()) as { carte?: CartaCollezione[] };
      this.collezione.set(data.carte ?? []);
    } catch (error) {
      console.error("Errore nel caricamento dell'album:", error);
      this.albumLoadError.set(true);
    }
  }

  protected selectFinitura(finitura: Finitura): void {
    this.finituraAttiva.set(finitura);
  }

  protected ingrandisciCarta(carta: { finitura: Finitura; immagineKey: string | null; designNome: string }): void {
    this.cartaIngranditaGirata.set(false);
    this.cartaIngrandita.set({ finitura: carta.finitura, immagineUrl: this.immagineUrl(carta.immagineKey), nome: carta.designNome });
  }

  protected giraCartaIngrandita(): void {
    this.cartaIngranditaGirata.update((girata) => !girata);
  }

  protected chiudiCartaIngrandita(): void {
    this.cartaIngrandita.set(null);
    this.cartaIngranditaGirata.set(false);
  }

  protected onIngranditaBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.chiudiCartaIngrandita();
  }

  // --- Scambi ---
  private async loadTrades(): Promise<void> {
    try {
      const response = await fetch('/api/carte-trade', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
      const data = (await response.json()) as { trades?: Trade[] };
      this.trades.set(data.trades ?? []);
    } catch (error) {
      console.error('Errore nel caricamento degli scambi:', error);
      this.tradesLoadError.set(true);
    }
  }

  protected aggiungiOfferta(): void {
    const id = this.nuovaOffertaId();
    const quantita = this.nuovaOffertaQuantita();
    if (!id || quantita < 1) return;
    const carta = this.carteMiePossedute().find((item) => item.definizioneId === id);
    if (!carta || quantita > carta.quantitaMia) {
      this.tradeError.set('Non possiedi abbastanza copie di questa carta.');
      return;
    }
    this.offertaBozza.update((items) => this.aggiungiOAccorpa(items, id, quantita, carta.quantitaMia));
    this.tradeError.set('');
    this.nuovaOffertaId.set('');
    this.nuovaOffertaQuantita.set(1);
  }

  protected rimuoviOfferta(index: number): void {
    this.offertaBozza.set(this.offertaBozza().filter((_, i) => i !== index));
  }

  protected aggiungiRichiesta(): void {
    const id = this.nuovaRichiestaId();
    const quantita = this.nuovaRichiestaQuantita();
    if (!id || quantita < 1) return;
    const carta = this.carteAltroPossedute().find((item) => item.definizioneId === id);
    if (!carta || quantita > carta.quantitaAltro) {
      this.tradeError.set(`${this.otherLabel()} non possiede abbastanza copie di questa carta.`);
      return;
    }
    this.richiestaBozza.update((items) => this.aggiungiOAccorpa(items, id, quantita, carta.quantitaAltro));
    this.tradeError.set('');
    this.nuovaRichiestaId.set('');
    this.nuovaRichiestaQuantita.set(1);
  }

  protected rimuoviRichiesta(index: number): void {
    this.richiestaBozza.set(this.richiestaBozza().filter((_, i) => i !== index));
  }

  protected async proponiTrade(): Promise<void> {
    if (this.proponendo()) return;
    if (this.offertaBozza().length === 0 && this.richiestaBozza().length === 0) {
      this.tradeError.set('Seleziona almeno una carta da offrire o richiedere.');
      return;
    }

    this.proponendo.set(true);
    this.tradeError.set('');

    try {
      const response = await fetch('/api/carte-trade', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerta: this.offertaBozza(),
          richiesta: this.richiestaBozza(),
          messaggio: this.nuovoMessaggio().trim() || undefined
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Non è stato possibile proporre lo scambio.');
      }

      this.offertaBozza.set([]);
      this.richiestaBozza.set([]);
      this.nuovoMessaggio.set('');
      await this.loadTrades();
    } catch (error) {
      this.tradeError.set(error instanceof Error ? error.message : 'Non è stato possibile proporre lo scambio.');
    } finally {
      this.proponendo.set(false);
    }
  }

  protected async accettaTrade(id: string): Promise<void> {
    const ok = await this.api.sendAuthenticatedJson(`/api/carte-trade/${id}/accetta`, {}, 'POST');
    if (!ok) {
      this.tradeError.set('Non è stato possibile accettare lo scambio.');
      return;
    }
    await Promise.all([this.loadTrades(), this.loadCollezione()]);
  }

  protected async rifiutaTrade(id: string): Promise<void> {
    const ok = await this.api.sendAuthenticatedJson(`/api/carte-trade/${id}/rifiuta`, {}, 'POST');
    if (!ok) {
      this.tradeError.set('Non è stato possibile rifiutare lo scambio.');
      return;
    }
    await this.loadTrades();
  }

  protected tradeVerso(trade: Trade): string {
    const destinatario = trade.destinatarioIdentity === this.ownIdentity() ? 'te' : this.otherLabel();
    const proponente = trade.proponenteIdentity === this.ownIdentity() ? 'tu' : this.otherLabel();
    return `Da ${proponente} a ${destinatario}`;
  }

  protected cartaPerId(id: string): CartaCollezione | undefined {
    return this.collezione().find((carta) => carta.definizioneId === id);
  }

  protected tradeStatoLabel(stato: TradeStato): string {
    return {
      proposto: 'In attesa',
      accettato: 'Accettato',
      rifiutato: 'Rifiutato',
      controproposto: 'Controproposto'
    }[stato];
  }

  protected tradeData(iso: string): string {
    return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  private aggiungiOAccorpa(
    items: { carteDefinizioneId: string; quantita: number }[],
    id: string,
    quantita: number,
    massimo: number
  ): { carteDefinizioneId: string; quantita: number }[] {
    const corrente = items.find((item) => item.carteDefinizioneId === id);
    if (!corrente) return [...items, { carteDefinizioneId: id, quantita }];
    return items.map((item) => item.carteDefinizioneId === id
      ? { ...item, quantita: Math.min(item.quantita + quantita, massimo) }
      : item);
  }

  // --- Editor admin ---
  private async loadEditorData(): Promise<void> {
    try {
      const [setsRes, designsRes] = await Promise.all([
        fetch('/api/carte-sets', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/carte-designs', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      ]);
      if (!setsRes.ok || !designsRes.ok) throw new Error('Caricamento fallito.');
      const setsData = (await setsRes.json()) as { sets?: CartaSet[] };
      const designsData = (await designsRes.json()) as { designs?: CartaDesign[] };
      this.sets.set(setsData.sets ?? []);
      this.designs.set(designsData.designs ?? []);
    } catch (error) {
      console.error("Errore nel caricamento dell'editor:", error);
      this.editorLoadError.set(true);
    }
  }

  protected async creaSet(): Promise<void> {
    const nome = this.nuovoSetNome().trim();
    if (!nome) return;

    const ok = await this.api.sendAuthenticatedJson('/api/carte-sets', {
      nome,
      descrizione: this.nuovoSetDescrizione().trim() || undefined
    }, 'POST');
    if (!ok) {
      this.editorError.set('Non è stato possibile creare il set.');
      return;
    }

    this.nuovoSetNome.set('');
    this.nuovoSetDescrizione.set('');
    await this.loadEditorData();
  }

  protected onDesignFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.nuovoDesignFile.set(input.files?.[0] ?? null);
  }

  protected async creaDesign(): Promise<void> {
    const setId = this.nuovoDesignSetId();
    const nome = this.nuovoDesignNome().trim();
    const file = this.nuovoDesignFile();
    if (!setId || !nome) {
      this.editorError.set('Set e nome sono obbligatori.');
      return;
    }

    this.uploadingDesign.set(true);
    this.editorError.set('');

    try {
      let immagineKey: string | undefined;
      if (file) {
        const uploadResponse = await fetch('/api/carte-media/upload?type=photo', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': file.type },
          body: file
        });
        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(typeof uploadResult.error === 'string' ? uploadResult.error : "Upload dell'immagine non riuscito.");
        }
        immagineKey = uploadResult.key;
      }

      const ok = await this.api.sendAuthenticatedJson('/api/carte-designs', { setId: Number(setId), nome, immagineKey }, 'POST');
      if (!ok) throw new Error('Non è stato possibile creare la carta.');

      this.nuovoDesignNome.set('');
      this.nuovoDesignFile.set(null);
      await this.loadEditorData();
    } catch (error) {
      this.editorError.set(error instanceof Error ? error.message : 'Non è stato possibile creare la carta.');
    } finally {
      this.uploadingDesign.set(false);
    }
  }

  protected async eliminaDesign(id: string): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/carte-designs/${id}`, {}, 'DELETE');
    await this.loadEditorData();
  }

  protected async eliminaSet(id: string): Promise<void> {
    const ok = await this.api.sendAuthenticatedJson(`/api/carte-sets/${id}`, {}, 'DELETE');
    if (!ok) {
      this.editorError.set('Non è stato possibile eliminare il set: contiene ancora delle carte.');
      return;
    }
    await this.loadEditorData();
  }
}
