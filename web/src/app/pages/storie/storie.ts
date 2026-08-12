import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { FormStatus } from '../../shared/form-status/form-status';
import { FormSubmission } from '../../shared/form-submission/form-submission';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AudioPlayer } from '../../shared/audio-player/audio-player';
import { EditorialText } from '../../shared/editorial-text/editorial-text';

interface Story {
  id: string;
  title: string;
  date: string;
  body: string;
  videoUrl?: string;
  audioKey?: string;
  audioLabel?: string;
  image?: string;
  imageAlt?: string;
}

interface StoryView {
  story: Story;
  position: number;
  formattedDate: string;
  bodyParagraphs: string[];
  videoSrc: SafeResourceUrl | null;
}

// Porting fedele di assets/js/stories/main.js: stessa fonte dati (content/stories.json),
// stessa validazione (esattamente 4 storie), stesso comportamento "apri la storia richiesta
// dall'hash dell'URL e portala a vista" (usato dai link diretti tipo #story-1), stesso invio
// del suggerimento come FormData verso /api/stories/suggestions.
@Component({
  selector: 'app-storie',
  standalone: true,
  imports: [AppShell, FormsModule, FormStatus, ContentMessage, AudioPlayer, EditorialText],
  providers: [FormSubmission],
  styleUrls: ['../../../styles/pages/stories.css'],
  templateUrl: './storie.html'
})
export class Storie implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly staticContent = inject(StaticContentService);
  protected readonly submission = inject(FormSubmission);

  protected readonly introduction = signal('');
  protected readonly stories = signal<StoryView[]>([]);
  protected readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadStories();
  }

  private async loadStories(): Promise<void> {
    try {
      const data = await this.staticContent.load<{ introduction: string; stories: Story[] }>('/content/stories.json');
      if (!Array.isArray(data.stories) || data.stories.length !== 4) {
        throw new Error('La raccolta deve contenere quattro storie');
      }

      this.introduction.set(data.introduction);
      this.stories.set(data.stories.map((story, position) => this.toStoryView(story, position)));

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

  // Apre la storia richiesta tramite URL e porta il lettore al suo inizio — stessa API nativa
  // di <details> dell'originale, non c'è un equivalente Angular dichiarativo pulito per
  // "scrolla e metti a fuoco un elemento nativo del browser".
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
}
