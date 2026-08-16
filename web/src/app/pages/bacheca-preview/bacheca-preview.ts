import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ContentMessage } from '../../shared/content-message/content-message';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { BachecaDayEditor } from './bacheca-day-editor/bacheca-day-editor';
import { DayContent, DayRow, PeriodRow, PhotoBlock } from './bacheca.types';

interface Day { id: string; title?: string; slug: string; rows: DayContent['rows']; memoryDate: string | null }
interface Period { id: string; title: string; days: Day[] }

interface PeriodDraft {
  id: string;
  title: string;
}

interface DayDraft {
  periodId: string;
  slug: string;
  title: string;
  memoryDate: string;
}

function emptyPeriodDraft(): PeriodDraft {
  return { id: '', title: '' };
}

function emptyDayDraft(periodId: string): DayDraft {
  return { periodId, slug: '', title: '', memoryDate: '' };
}

// Fase 1-3 dell'editor "ibrido" della Bacheca (opzione D concordata il 12/08/2026): periodi e
// giorni letti da /api/bacheca-periods + /api/bacheca-days, con un pannello admin per
// creare/modificare/eliminare/riordinare periodi e giorni, e un editor visuale
// (BachecaDayEditor) che sostituisce in loco la lettura di un giorno quando si preme
// "Modifica il contenuto" — niente JSON grezzo mostrato all'utente.
@Component({
  selector: 'app-bacheca-preview',
  standalone: true,
  imports: [AppShell, RouterLink, AudioPlayer, ContentMessage, EditorialText, FormsModule, ConfirmationDialog, BachecaDayEditor],
  styleUrls: ['../../../styles/pages/bacheca-preview.css'],
  templateUrl: './bacheca-preview.html'
})
export class BachecaPreview implements OnInit, AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);
  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  @ViewChild('lightbox') private lightboxRef?: ElementRef<HTMLDialogElement>;
  protected readonly loadError = signal(false);
  protected readonly activeGallery = signal<PhotoBlock[]>([]);
  protected readonly activeIndex = signal(0);
  protected readonly activePhoto = signal<PhotoBlock | null>(null);
  private touchStartX: number | null = null;

  private readonly rawPeriods = signal<PeriodRow[]>([]);
  private readonly rawDays = signal<DayRow[]>([]);

  // #e14bis: id del blocco raggiunto da ?blocco=<rowIndex-colIndex-blockIndex>, evidenziato
  // temporaneamente dopo lo scroll. null quando nessun deep-link a blocco è attivo.
  protected readonly highlightedBlockId = signal<string | null>(null);

  protected readonly layoutPeriods = computed<Period[]>(() =>
    [...this.rawPeriods()]
      .sort((a, b) => a.position - b.position)
      .map((period) => ({
        id: period.id,
        title: period.title,
        days: this.rawDays()
          .filter((day) => day.periodId === period.id)
          .sort((a, b) => a.position - b.position)
          .map((day) => ({ id: day.id, title: day.title ?? undefined, slug: day.slug, rows: day.content.rows, memoryDate: day.memoryDate }))
      }))
  );

  // -------------------- Editor del contenuto di un giorno --------------------
  protected readonly editingDayId = signal<string | null>(null);
  protected readonly contentDirty = signal(false);
  protected readonly contentSaving = signal(false);
  protected readonly contentSaveError = signal('');

  // -------------------- Admin: periodi --------------------
  protected readonly periodEditingId = signal<string | null>(null);
  protected readonly periodDraft = signal<PeriodDraft>(emptyPeriodDraft());
  protected readonly periodFormError = signal('');
  protected readonly periodDeleteTargetId = signal<string | null>(null);

  // -------------------- Admin: giorni (metadati: titolo/slug/periodo/posizione) --------------------
  protected readonly dayEditingId = signal<string | null>(null);
  protected readonly dayDraft = signal<DayDraft>(emptyDayDraft(''));
  protected readonly dayFormError = signal('');
  protected readonly dayDeleteTargetId = signal<string | null>(null);
  protected readonly dayMoveTargetId = signal<string | null>(null);
  protected readonly dayMovePeriodId = signal('');
  protected readonly dayMoveAfterId = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadLayout();
    this.scrollToRequestedDay();
  }

  // #e14: deep-link dal banner "Ecco qualcosa che è successo oggi" (?giorno=<id>) — apre
  // direttamente sul giorno richiesto. Riusa il fragment già calcolato da dayId() (period.id
  // o period.id-slug), lo stesso usato dai link della nav interna.
  // #e14bis: se è presente anche ?blocco=<rowIndex-colIndex-blockIndex>, dopo aver raggiunto il
  // giorno fa scroll/evidenzia quel blocco specifico invece del giorno intero.
  private scrollToRequestedDay(): void {
    const dayIdParam = this.route.snapshot.queryParamMap.get('giorno');
    if (!dayIdParam) {
      return;
    }
    const day = this.rawDays().find((d) => d.id === dayIdParam);
    const period = this.rawPeriods().find((p) => p.id === day?.periodId);
    if (!day || !period) {
      return;
    }
    const blockParam = this.route.snapshot.queryParamMap.get('blocco');
    const targetId = blockParam
      ? this.blockDomId(day.id, ...(blockParam.split('-').map(Number) as [number, number, number]))
      : this.dayId(
          { id: period.id, title: period.title, days: [] },
          { id: day.id, title: day.title ?? undefined, slug: day.slug, rows: day.content.rows, memoryDate: day.memoryDate }
        );
    if (blockParam) {
      this.highlightedBlockId.set(targetId);
    }
    requestAnimationFrame(() => this.scrollToTargetUntilStable(targetId));
  }

  // Le foto/i video del giorno caricano con `loading="lazy"` e senza dimensioni riservate:
  // mentre la pagina scrolla verso un blocco lontano, le immagini sopra il target continuano
  // a caricarsi e ne spostano la posizione verso il basso. Un solo scrollIntoView calcolato
  // all'inizio finisce quindi molto lontano dal bersaglio reale. Si ripete lo scroll finché
  // la posizione del target non resta stabile per un breve periodo (o scade un timeout).
  private scrollToTargetUntilStable(targetId: string): void {
    const deadline = Date.now() + 4000;
    let lastTop: number | null = null;
    let stableSince: number | null = null;

    const tick = () => {
      const el = document.getElementById(targetId);
      if (!el) {
        if (Date.now() < deadline) requestAnimationFrame(tick);
        return;
      }
      const top = el.getBoundingClientRect().top;
      const isCentered = Math.abs(top - window.innerHeight / 2) < 4;
      if (!isCentered) {
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
      const stableEnough = lastTop !== null && Math.abs(top - lastTop) < 2;
      lastTop = top;
      if (stableEnough) {
        stableSince ??= Date.now();
        if (Date.now() - stableSince > 300) return;
      } else {
        stableSince = null;
      }
      if (Date.now() < deadline) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // #e14bis: identificatore stabile (finché il contenuto del giorno non viene riordinato) di un
  // blocco, usato sia come id DOM sia come valore del query param ?blocco= nei deep-link dal
  // banner "successo oggi" — niente id persistito nel JSON, la posizione basta per uno
  // scroll/evidenziazione mirati.
  protected blockDomId(dayId: string, rowIndex: number, colIndex: number, blockIndex: number): string {
    return `bacheca-blocco-${dayId}-${rowIndex}-${colIndex}-${blockIndex}`;
  }

  // Lightbox e utility media: prima ereditati dal componente legacy pages/bacheca (mai
  // instradato, letto solo per queste funzioni condivise); portati qui direttamente ora che
  // bacheca.json/bacheca-layout.json sono stati archiviati e quel componente è stato rimosso.
  ngAfterViewInit(): void {
    const dialog = this.lightboxRef?.nativeElement;
    if (!dialog) {
      return;
    }
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        this.stepLightbox(-1);
      }
      if (event.key === 'ArrowRight') {
        this.stepLightbox(1);
      }
    });
    dialog.addEventListener(
      'touchstart',
      (event) => {
        this.touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );
    dialog.addEventListener(
      'touchend',
      (event) => {
        if (this.touchStartX === null) {
          return;
        }
        const delta = event.changedTouches[0].clientX - this.touchStartX;
        if (Math.abs(delta) > 40) {
          this.stepLightbox(delta > 0 ? -1 : 1);
        }
        this.touchStartX = null;
      },
      { passive: true }
    );
  }

  protected mediaUrl(key: string): string {
    return `/api/media/${key}`;
  }

  protected openLightbox(gallery: PhotoBlock[], index: number): void {
    this.activeGallery.set(gallery);
    this.activeIndex.set(index);
    this.activePhoto.set(gallery[index]);
    this.lightboxRef?.nativeElement.showModal();
  }

  protected closeLightbox(): void {
    this.lightboxRef?.nativeElement.close();
  }

  protected stepLightbox(delta: number): void {
    const gallery = this.activeGallery();
    if (gallery.length === 0) {
      return;
    }
    const nextIndex = (this.activeIndex() + delta + gallery.length) % gallery.length;
    this.activeIndex.set(nextIndex);
    this.activePhoto.set(gallery[nextIndex]);
  }

  private async loadLayout(): Promise<void> {
    try {
      const [periodsRes, daysRes] = await Promise.all([
        fetch('/api/bacheca-periods', { credentials: 'same-origin', headers: { Accept: 'application/json' } }),
        fetch('/api/bacheca-days', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      ]);
      if (!periodsRes.ok || !daysRes.ok) {
        throw new Error('Errore nel caricamento della Bacheca');
      }
      const [periodsData, daysData] = await Promise.all([
        this.api.readApiResponse<{ periods?: PeriodRow[] }>(periodsRes),
        this.api.readApiResponse<{ days?: DayRow[] }>(daysRes)
      ]);
      this.rawPeriods.set(periodsData.periods ?? []);
      this.rawDays.set(daysData.days ?? []);
    } catch (error) {
      console.error(error);
      this.loadError.set(true);
    }
  }

  protected dayId(p: Period, d: Day): string {
    return d.slug === 'generale' ? p.id : `${p.id}-${d.slug}`;
  }

  protected rowPhotos(r: DayContent['rows'][number]): PhotoBlock[] {
    return r.columns.flatMap((c) => c.blocks.filter((b): b is PhotoBlock => b.type === 'photo'));
  }

  // -------------------- Editor del contenuto --------------------

  protected toggleContentEditor(dayId: string): void {
    if (this.editingDayId() === dayId && this.contentDirty()
      && !window.confirm('Ci sono modifiche non salvate. Vuoi davvero chiudere l’editor?')) {
      return;
    }
    this.contentDirty.set(false);
    this.contentSaveError.set('');
    this.editingDayId.set(this.editingDayId() === dayId ? null : dayId);
  }

  protected async saveDayContent(dayId: string, content: DayContent): Promise<void> {
    const day = this.rawDays().find((d) => d.id === dayId);
    if (!day || this.contentSaving()) return;
    this.contentSaving.set(true);
    this.contentSaveError.set('');
    try {
      const ok = await this.api.sendAuthenticatedJson(`/api/bacheca-days/${dayId}`, {
        slug: day.slug,
        title: day.title,
        content,
        memoryDate: day.memoryDate
      }, 'PUT');
      if (!ok) {
        this.contentSaveError.set('Il salvataggio non è riuscito. Le modifiche sono ancora nell’editor: riprova prima di uscire.');
        return;
      }
      this.contentDirty.set(false);
      this.editingDayId.set(null);
      await this.loadLayout();
    } finally {
      this.contentSaving.set(false);
    }
  }

  // -------------------- Admin: periodi --------------------

  protected startCreatePeriod(): void {
    this.periodDraft.set(emptyPeriodDraft());
    this.periodFormError.set('');
    this.periodEditingId.set('__new__');
  }

  protected startEditPeriod(period: PeriodRow): void {
    this.periodDraft.set({ id: period.id, title: period.title });
    this.periodFormError.set('');
    this.periodEditingId.set(period.id);
  }

  protected cancelEditPeriod(): void {
    this.periodEditingId.set(null);
  }

  protected updatePeriodDraft(patch: Partial<PeriodDraft>): void {
    this.periodDraft.set({ ...this.periodDraft(), ...patch });
  }

  protected async submitPeriod(): Promise<void> {
    const d = this.periodDraft();
    if (!d.title.trim()) {
      this.periodFormError.set('Il titolo è obbligatorio.');
      return;
    }

    const isNew = this.periodEditingId() === '__new__';
    const payload = { ...(isNew ? { id: d.id.trim().toLowerCase() } : {}), title: d.title.trim() };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.periodFormError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/bacheca-periods' : `/api/bacheca-periods/${this.periodEditingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.periodFormError.set('Non è stato possibile salvare il periodo.');
      return;
    }
    this.periodEditingId.set(null);
    await this.loadLayout();
  }

  protected requestDeletePeriod(id: string): void {
    this.periodDeleteTargetId.set(id);
  }

  protected cancelDeletePeriod(): void {
    this.periodDeleteTargetId.set(null);
  }

  protected async confirmDeletePeriod(): Promise<void> {
    const id = this.periodDeleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/bacheca-periods/${id}`, {}, 'DELETE');
    this.periodDeleteTargetId.set(null);
    await this.loadLayout();
  }

  protected async movePeriod(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/bacheca-periods/${id}/move`, { direction }, 'POST');
    await this.loadLayout();
  }

  // -------------------- Admin: giorni --------------------

  protected startCreateDay(periodId: string): void {
    this.dayDraft.set(emptyDayDraft(periodId));
    this.dayFormError.set('');
    this.dayEditingId.set('__new__');
  }

  protected startEditDay(day: DayRow): void {
    this.dayDraft.set({ periodId: day.periodId, slug: day.slug, title: day.title ?? '', memoryDate: day.memoryDate ?? '' });
    this.dayFormError.set('');
    this.dayEditingId.set(day.id);
  }

  protected cancelEditDay(): void {
    this.dayEditingId.set(null);
  }

  protected updateDayDraft(patch: Partial<DayDraft>): void {
    this.dayDraft.set({ ...this.dayDraft(), ...patch });
  }

  protected async submitDay(): Promise<void> {
    const d = this.dayDraft();
    const slug = d.slug.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(slug)) {
      this.dayFormError.set('Slug non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const isNew = this.dayEditingId() === '__new__';
    const memoryDate = d.memoryDate.trim() || null;
    if (isNew) {
      const ok = await this.api.sendAuthenticatedJson('/api/bacheca-days', {
        periodId: d.periodId,
        slug,
        title: d.title.trim() || null,
        content: { rows: [{ columns: [{ width: 1, blocks: [{ type: 'text', text: 'Nuovo giorno: aggiungi qui il primo blocco.' }] }] }] },
        memoryDate
      }, 'POST');
      if (!ok) {
        this.dayFormError.set('Non è stato possibile creare il giorno.');
        return;
      }
    } else {
      const existing = this.rawDays().find((day) => day.id === this.dayEditingId());
      if (!existing) return;
      const ok = await this.api.sendAuthenticatedJson(`/api/bacheca-days/${this.dayEditingId()}`, {
        slug,
        title: d.title.trim() || null,
        content: existing.content,
        memoryDate
      }, 'PUT');
      if (!ok) {
        this.dayFormError.set('Non è stato possibile salvare il giorno.');
        return;
      }
    }

    this.dayEditingId.set(null);
    await this.loadLayout();
  }

  protected requestDeleteDay(id: string): void {
    this.dayDeleteTargetId.set(id);
  }

  protected cancelDeleteDay(): void {
    this.dayDeleteTargetId.set(null);
  }

  protected async confirmDeleteDay(): Promise<void> {
    const id = this.dayDeleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/bacheca-days/${id}`, {}, 'DELETE');
    this.dayDeleteTargetId.set(null);
    await this.loadLayout();
  }

  protected async moveDay(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/bacheca-days/${id}/move`, { direction }, 'POST');
    await this.loadLayout();
  }

  protected startMoveDay(day: DayRow): void {
    this.dayMoveTargetId.set(day.id);
    this.dayMovePeriodId.set(day.periodId);
    this.dayMoveAfterId.set('');
  }

  protected cancelMoveDay(): void {
    this.dayMoveTargetId.set(null);
  }

  protected daysForMoveTarget(): DayRow[] {
    const targetPeriod = this.dayMovePeriodId();
    const movingId = this.dayMoveTargetId();
    return this.rawDays()
      .filter((day) => day.periodId === targetPeriod && day.id !== movingId)
      .sort((a, b) => a.position - b.position);
  }

  protected async confirmMoveDay(): Promise<void> {
    const id = this.dayMoveTargetId();
    if (!id) return;
    const ok = await this.api.sendAuthenticatedJson(`/api/bacheca-days/${id}/move-to`, {
      periodId: this.dayMovePeriodId(),
      afterId: this.dayMoveAfterId() || null
    }, 'POST');
    if (ok) {
      this.dayMoveTargetId.set(null);
      await this.loadLayout();
    }
  }
}
