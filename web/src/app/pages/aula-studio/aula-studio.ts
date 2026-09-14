import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppShell } from '../../shell/app-shell';
import { ApiService } from '../../core/api.service';
import { StudyFocusService } from '../../core/study-focus.service';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog';

interface StudyCard {
  id?: number;
  question: string;
  answer: string;
  position?: number;
}

interface StudyTopic {
  id: number;
  title: string;
  cards: StudyCard[];
  createdAt: string;
  updatedAt: string;
}

interface TopicDraft {
  title: string;
  pairs: string;
}

interface ParsedPairs {
  cards: StudyCard[];
  danglingQuestion: string | null;
}

export function parseStudyPairs(value: string): ParsedPairs {
  const lines = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const cards: StudyCard[] = [];

  for (let index = 0; index + 1 < lines.length; index += 2) {
    cards.push({ question: lines[index], answer: lines[index + 1] });
  }

  return {
    cards,
    danglingQuestion: lines.length % 2 === 1 ? (lines.at(-1) ?? null) : null,
  };
}

function topicToDraft(topic: StudyTopic): TopicDraft {
  return {
    title: topic.title,
    pairs: topic.cards.flatMap((card) => [card.question, card.answer]).join('\n'),
  };
}

function shuffledIndices(length: number): number[] {
  const result = Array.from({ length }, (_, index) => index);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

@Component({
  selector: 'app-aula-studio',
  standalone: true,
  imports: [AppShell, FormsModule, ConfirmationDialog],
  styleUrls: ['../../../styles/pages/aula-studio.css'],
  templateUrl: './aula-studio.html',
})
export class AulaStudio implements OnDestroy {
  private readonly api = inject(ApiService);
  protected readonly focusMode = inject(StudyFocusService);

  protected readonly topics = signal<StudyTopic[]>([]);
  protected readonly loading = signal(true);
  protected readonly pageError = signal('');
  protected readonly saving = signal(false);

  protected readonly editingId = signal<number | 'new' | null>(null);
  protected readonly draft = signal<TopicDraft>({ title: '', pairs: '' });
  protected readonly formError = signal('');
  protected readonly parsedPairs = computed(() => parseStudyPairs(this.draft().pairs));
  protected readonly deleteTarget = signal<StudyTopic | null>(null);

  protected readonly studyingTopicId = signal<number | null>(null);
  private readonly studyOrder = signal<number[]>([]);
  protected readonly studyPosition = signal(0);
  protected readonly flipped = signal(false);
  protected readonly studyingTopic = computed(
    () => this.topics().find((topic) => topic.id === this.studyingTopicId()) ?? null,
  );
  protected readonly currentCard = computed(() => {
    const topic = this.studyingTopic();
    const cardIndex = this.studyOrder()[this.studyPosition()];
    return topic && cardIndex !== undefined ? topic.cards[cardIndex] : null;
  });

  constructor() {
    this.focusMode.enterPage();
    void this.load();
  }

  ngOnDestroy(): void {
    this.focusMode.leavePage();
  }

  protected toggleFocusMode(): void {
    this.focusMode.setEnabled(!this.focusMode.enabled());
  }

  protected startCreate(): void {
    this.closeStudy();
    this.draft.set({ title: '', pairs: '' });
    this.formError.set('');
    this.editingId.set('new');
  }

  protected startEdit(topic: StudyTopic): void {
    this.closeStudy();
    this.draft.set(topicToDraft(topic));
    this.formError.set('');
    this.editingId.set(topic.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.formError.set('');
  }

  protected updateDraft(patch: Partial<TopicDraft>): void {
    this.draft.set({ ...this.draft(), ...patch });
  }

  protected async saveTopic(): Promise<void> {
    const title = this.draft().title.trim();
    const parsed = this.parsedPairs();
    if (!title) {
      this.formError.set('Scrivi un nome per l’argomento.');
      return;
    }
    if (parsed.danglingQuestion) {
      this.formError.set(`Manca la risposta a: “${parsed.danglingQuestion}”.`);
      return;
    }
    if (parsed.cards.length === 0) {
      this.formError.set('Aggiungi almeno una domanda e la sua risposta.');
      return;
    }
    if (parsed.cards.length > 200) {
      this.formError.set('Un argomento può contenere al massimo 200 flash card.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    const editingId = this.editingId();
    const isNew = editingId === 'new';
    const endpoint = isNew ? '/api/study-topics' : `/api/study-topics/${editingId}`;
    try {
      const response = await fetch(endpoint, {
        method: isNew ? 'POST' : 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cards: parsed.cards }),
      });
      const result = await this.api.readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(result.error || 'Salvataggio non riuscito.');
      this.editingId.set(null);
      await this.load();
    } catch (error) {
      this.formError.set(
        error instanceof Error ? error.message : 'Non è stato possibile salvare l’argomento.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected requestDelete(topic: StudyTopic): void {
    this.deleteTarget.set(topic);
  }

  protected async confirmDelete(): Promise<void> {
    const topic = this.deleteTarget();
    if (!topic) return;
    try {
      const response = await fetch(`/api/study-topics/${topic.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error();
      this.deleteTarget.set(null);
      if (this.studyingTopicId() === topic.id) this.closeStudy();
      await this.load();
    } catch {
      this.pageError.set('Non è stato possibile eliminare l’argomento.');
      this.deleteTarget.set(null);
    }
  }

  protected startStudy(topic: StudyTopic): void {
    this.cancelEdit();
    this.studyingTopicId.set(topic.id);
    this.shuffleDeck();
  }

  protected closeStudy(): void {
    this.studyingTopicId.set(null);
    this.studyOrder.set([]);
    this.studyPosition.set(0);
    this.flipped.set(false);
  }

  protected shuffleDeck(): void {
    const topic = this.studyingTopic();
    if (!topic) return;
    this.studyOrder.set(shuffledIndices(topic.cards.length));
    this.studyPosition.set(0);
    this.flipped.set(false);
  }

  protected previousCard(): void {
    if (this.studyPosition() === 0) return;
    this.studyPosition.update((position) => position - 1);
    this.flipped.set(false);
  }

  protected nextCard(): void {
    if (this.studyPosition() >= this.studyOrder().length - 1) return;
    this.studyPosition.update((position) => position + 1);
    this.flipped.set(false);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.pageError.set('');
    try {
      const response = await fetch('/api/study-topics', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const result = await this.api.readApiResponse<{ topics?: StudyTopic[]; error?: string }>(
        response,
      );
      if (!response.ok) throw new Error(result.error || 'Caricamento non riuscito.');
      this.topics.set(result.topics ?? []);
    } catch (error) {
      this.pageError.set(
        error instanceof Error ? error.message : 'Non è stato possibile aprire l’Aula studio.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
