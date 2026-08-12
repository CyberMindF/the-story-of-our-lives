import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { ContentMessage } from '../../shared/content-message/content-message';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { BachecaDayEditor } from './bacheca-day-editor/bacheca-day-editor';
import { DayContent, DayRow, PeriodRow, PhotoBlock } from './bacheca.types';

interface Day { id: string; title?: string; slug: string; rows: DayContent['rows'] }
interface Period { id: string; title: string; days: Day[] }

interface PeriodDraft {
  id: string;
  title: string;
}

interface DayDraft {
  periodId: string;
  slug: string;
  title: string;
}

function emptyPeriodDraft(): PeriodDraft {
  return { id: '', title: '' };
}

function emptyDayDraft(periodId: string): DayDraft {
  return { periodId, slug: '', title: '' };
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

  protected readonly layoutPeriods = computed<Period[]>(() =>
    [...this.rawPeriods()]
      .sort((a, b) => a.position - b.position)
      .map((period) => ({
        id: period.id,
        title: period.title,
        days: this.rawDays()
          .filter((day) => day.periodId === period.id)
          .sort((a, b) => a.position - b.position)
          .map((day) => ({ id: day.id, title: day.title ?? undefined, slug: day.slug, rows: day.content.rows }))
      }))
  );

  // -------------------- Editor del contenuto di un giorno --------------------
  protected readonly editingDayId = signal<string | null>(null);

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
    this.editingDayId.set(this.editingDayId() === dayId ? null : dayId);
  }

  protected async saveDayContent(dayId: string, content: DayContent): Promise<void> {
    const day = this.rawDays().find((d) => d.id === dayId);
    if (!day) return;
    const ok = await this.api.sendAuthenticatedJson(`/api/bacheca-days/${dayId}`, {
      slug: day.slug,
      title: day.title,
      content
    }, 'PUT');
    if (ok) {
      this.editingDayId.set(null);
      await this.loadLayout();
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
    this.dayDraft.set({ periodId: day.periodId, slug: day.slug, title: day.title ?? '' });
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
    if (isNew) {
      const ok = await this.api.sendAuthenticatedJson('/api/bacheca-days', {
        periodId: d.periodId,
        slug,
        title: d.title.trim() || null,
        content: { rows: [{ columns: [{ width: 1, blocks: [{ type: 'text', text: 'Nuovo giorno: aggiungi qui il primo blocco.' }] }] }] }
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
        content: existing.content
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
