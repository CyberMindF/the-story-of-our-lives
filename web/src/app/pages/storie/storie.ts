import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

interface Story {
  id: string;
  title: string;
  date: string;
  body: string;
  videoUrl: string | null;
  audioKey: string | null;
  audioLabel: string | null;
  image: string | null;
  imageAlt: string | null;
  position: number;
}

interface StoryView {
  story: Story;
  position: number;
  formattedDate: string;
  bodyParagraphs: string[];
  videoSrc: SafeResourceUrl | null;
}

interface StoryDraft {
  id: string;
  title: string;
  date: string;
  body: string;
  videoUrl: string;
  audioKey: string;
  audioLabel: string;
  image: string;
  imageAlt: string;
}

function emptyDraft(): StoryDraft {
  return { id: '', title: '', date: '', body: '', videoUrl: '', audioKey: '', audioLabel: '', image: '', imageAlt: '' };
}

function toDraft(story: Story): StoryDraft {
  return {
    id: story.id,
    title: story.title,
    date: story.date,
    body: story.body,
    videoUrl: story.videoUrl ?? '',
    audioKey: story.audioKey ?? '',
    audioLabel: story.audioLabel ?? '',
    image: story.image ?? '',
    imageAlt: story.imageAlt ?? ''
  };
}

// Editor dedicato delle Storie (documentazione/cms/planning-editor-contenuti.md, Fase 7): le storie vivono ora in
// stories via /api/stories, non più in content/stories.json. Stesso pattern del Ricettario
// (position esplicito, riordino "su/giù"). Niente più vincolo "esattamente 4 storie": era
// pensato per uno snapshot statico, avrebbe rotto la pagina alla prima storia aggiunta
// dall'editor (stesso bug già corretto nel Calendario).
@Component({
  selector: 'app-storie',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, ContentMessage, AudioPlayer, EditorialText, ConfirmationDialog],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/stories.css'],
  templateUrl: './storie.html'
})
export class Storie {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly api = inject(ApiService);
  protected readonly authService = inject(AuthService);
  protected readonly submission = inject(FormSubmission);

  protected readonly canEdit = computed(() => this.authService.isAdmin() && this.authService.adminModeEnabled());

  private readonly stories = signal<Story[]>([]);
  protected readonly storyViews = computed(() =>
    [...this.stories()].sort((a, b) => a.position - b.position).map((story, position) => this.toStoryView(story, position))
  );
  protected readonly loadError = signal(false);

  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<StoryDraft>(emptyDraft());
  protected readonly formError = signal('');
  protected readonly deleteTargetId = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/stories', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Errore ${response.status}`);
      const result = await this.api.readApiResponse<{ stories?: Story[] }>(response);
      this.stories.set(result.stories ?? []);

      const requestedStory = window.location.hash.replace('#story-', '');
      if (requestedStory) {
        requestAnimationFrame(() => this.openStory(requestedStory));
      }
    } catch (error) {
      console.error('Errore nel caricamento delle storie:', error);
      this.loadError.set(true);
    }
  }

  private toStoryView(story: Story, position: number): StoryView {
    const [year, month, day] = story.date.split('-');
    return {
      story,
      position,
      formattedDate: `${day}/${month}/${year}`,
      bodyParagraphs: story.body.split('\n').filter((line) => line.trim()),
      videoSrc: story.videoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(story.videoUrl) : null
    };
  }

  private openStory(storyId: string): void {
    const story = document.getElementById(`story-${storyId}`) as HTMLDetailsElement | null;
    if (!story) {
      return;
    }
    story.open = true;
    story.scrollIntoView({ behavior: 'smooth', block: 'start' });
    story.querySelector('summary')?.focus({ preventScroll: true });
  }

  protected audioUrl(key: string): string {
    return `/api/media/${key}`;
  }

  protected async submitSuggestion(form: HTMLFormElement): Promise<void> {
    await this.submission.submit(form, {
      url: '/api/stories/suggestions',
      pendingMessage: 'Sto conservando la tua storia...',
      successMessage: (result) => `La storia è stata conservata. Grazie, ${String(result['author'] || '')}.`
    });
  }

  protected startCreate(): void {
    this.draft.set(emptyDraft());
    this.formError.set('');
    this.editingId.set('__new__');
  }

  protected startEdit(story: Story): void {
    this.draft.set(toDraft(story));
    this.formError.set('');
    this.editingId.set(story.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected updateDraft(patch: Partial<StoryDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async submitEdit(): Promise<void> {
    const d = this.draft();
    if (!d.title.trim() || !d.date.trim() || !d.body.trim()) {
      this.formError.set('Titolo, data e testo sono obbligatori.');
      return;
    }

    const isNew = this.editingId() === '__new__';
    const payload = {
      ...(isNew ? { id: d.id.trim().toLowerCase() } : {}),
      title: d.title.trim(),
      date: d.date.trim(),
      body: d.body.trim(),
      videoUrl: d.videoUrl.trim() || null,
      audioKey: d.audioKey.trim() || null,
      audioLabel: d.audioLabel.trim() || null,
      image: d.image.trim() || null,
      imageAlt: d.imageAlt.trim() || null
    };

    if (isNew && !/^[a-z][a-z0-9-]{0,63}$/.test(payload.id ?? '')) {
      this.formError.set('ID non valido: solo lettere minuscole, numeri e trattini.');
      return;
    }

    const endpoint = isNew ? '/api/stories' : `/api/stories/${this.editingId()}`;
    const ok = await this.api.sendAuthenticatedJson(endpoint, payload, isNew ? 'POST' : 'PUT');
    if (!ok) {
      this.formError.set('Non è stato possibile salvare la storia.');
      return;
    }

    this.editingId.set(null);
    await this.load();
  }

  protected requestDelete(id: string): void {
    this.deleteTargetId.set(id);
  }

  protected cancelDelete(): void {
    this.deleteTargetId.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const id = this.deleteTargetId();
    if (!id) return;
    await this.api.sendAuthenticatedJson(`/api/stories/${id}`, {}, 'DELETE');
    this.deleteTargetId.set(null);
    await this.load();
  }

  protected async move(id: string, direction: 'up' | 'down'): Promise<void> {
    await this.api.sendAuthenticatedJson(`/api/stories/${id}/move`, { direction }, 'POST');
    await this.load();
  }
}
