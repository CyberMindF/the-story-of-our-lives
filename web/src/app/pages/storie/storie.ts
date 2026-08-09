import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';

interface Story {
  id: string;
  title: string;
  date: string;
  body: string;
  videoUrl?: string;
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
  imports: [RouterLink, AppShell],
  styleUrls: ['../../../../asset-root/assets/css/pages/stories.css'],
  templateUrl: './storie.html'
})
export class Storie implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly introduction = signal('');
  protected readonly stories = signal<StoryView[]>([]);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitStatus = signal<'' | 'success' | 'error'>('');
  protected readonly submitMessage = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadStories();
  }

  private async loadStories(): Promise<void> {
    try {
      const response = await fetch('/content/stories.json');
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }

      const data = (await response.json()) as { introduction: string; stories: Story[] };
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

  protected async submitSuggestion(form: HTMLFormElement): Promise<void> {
    this.submitting.set(true);
    this.submitStatus.set('');
    this.submitMessage.set('Sto conservando la tua storia...');

    try {
      const response = await fetch('/api/stories/suggestions', {
        method: 'POST',
        credentials: 'same-origin',
        body: new FormData(form)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Invio non riuscito.');
      }

      form.reset();
      this.submitStatus.set('success');
      this.submitMessage.set(`La storia è stata conservata. Grazie, ${result.author}.`);
    } catch (error) {
      this.submitStatus.set('error');
      this.submitMessage.set(error instanceof Error ? error.message : 'Invio non riuscito.');
    } finally {
      this.submitting.set(false);
    }
  }
}
