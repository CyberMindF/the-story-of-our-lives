import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../shell/app-shell';
import { AppSelect, AppSelectOption } from '../../shared/app-select/app-select';

type ActivityStatus = 'todo' | 'done' | 'repeat' | 'unavailable';
type ActivityFilter = 'all' | ActivityStatus;

interface TogetherActivity {
  id: number;
  number: number;
  text: string | null;
  category: string;
  link: string | null;
  approximateDate: string | null;
  hasPrivatePart: boolean;
  privateOnly: boolean;
  status: ActivityStatus;
}

interface PrivatePart {
  id: number;
  text: string;
}

const STATUS_LABEL: Record<ActivityStatus, string> = {
  todo: 'Da fare',
  done: 'Fatto',
  repeat: 'Da rifare',
  unavailable: 'Non più possibile'
};

const CATEGORY_LABEL: Record<string, string> = {
  giochi: 'Giochi',
  ricordi: 'Foto e ricordi',
  uscite: 'Posti e uscite',
  cibo: 'Cose buone',
  gesti: 'Piccoli gesti',
  'da-vedere': 'Da vedere',
  momenti: 'Momenti insieme',
  trend: 'Idee viste online',
  intimita: 'Intimità'
};

@Component({
  selector: 'app-cose-insieme',
  standalone: true,
  imports: [AppShell, AppSelect, RouterLink],
  styleUrls: ['../../../styles/pages/cose-insieme.css'],
  templateUrl: './cose-insieme.html'
})
export class CoseInsieme {
  protected readonly activities = signal<TogetherActivity[]>([]);
  protected readonly filter = signal<ActivityFilter>('all');
  protected readonly categoryFilter = signal('all');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly savingId = signal<number | null>(null);
  protected readonly unlockOpen = signal(false);
  protected readonly unlocking = signal(false);
  protected readonly unlockError = signal('');
  protected readonly privateParts = signal(new Map<number, string>());
  protected readonly unlocked = computed(() => this.privateParts().size > 0);
  protected readonly visibleActivities = computed(() => {
    const status = this.filter();
    const category = this.categoryFilter();
    return this.activities().filter((item) =>
      (status === 'all' || item.status === status) &&
      (category === 'all' || item.category === category)
    );
  });
  protected readonly categories = computed(() =>
    [...new Set(this.activities().map((item) => item.category))]
  );
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly categoryLabel = CATEGORY_LABEL;
  protected readonly statusOptions: readonly AppSelectOption[] = [
    { value: 'todo', label: '○ Da fare' },
    { value: 'done', label: '✓ Fatto' },
    { value: 'repeat', label: '↻ Da rifare' },
    { value: 'unavailable', label: '— Non più possibile' }
  ];

  constructor() {
    void this.load();
  }

  protected setFilter(filter: ActivityFilter): void {
    this.filter.set(filter);
  }

  protected async setStatus(activity: TogetherActivity, next: ActivityStatus): Promise<void> {
    if (this.savingId() !== null || next === activity.status || !STATUS_LABEL[next]) return;
    const previous = activity.status;
    this.updateLocalStatus(activity.id, next);
    this.savingId.set(activity.id);

    try {
      const response = await fetch('/api/together/status', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activity.id, status: next })
      });
      if (!response.ok) throw new Error();
    } catch {
      this.updateLocalStatus(activity.id, previous);
      this.error.set('Non sono riuscito a salvare la modifica. Riprova.');
    } finally {
      this.savingId.set(null);
    }
  }

  protected async unlock(answerInput: HTMLInputElement): Promise<void> {
    const answer = answerInput.value.trim();
    if (!answer || this.unlocking()) return;
    this.unlocking.set(true);
    this.unlockError.set('');

    try {
      const response = await fetch('/api/together/unlock', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const data = (await response.json()) as { unlocked?: boolean; privateParts?: PrivatePart[]; error?: string };
      if (!response.ok) throw new Error(data.error);
      if (!data.unlocked) {
        this.unlockError.set('Se non si è sbloccato vuol dire che pensavo fosse una cosa diversa ahaha');
        return;
      }
      this.privateParts.set(new Map((data.privateParts ?? []).map((part) => [part.id, part.text])));
      this.unlockOpen.set(false);
      answerInput.value = '';
    } catch (error) {
      this.unlockError.set(error instanceof Error && error.message ? error.message : 'Non sono riuscito a controllare la risposta.');
    } finally {
      this.unlocking.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch('/api/together', { credentials: 'same-origin' });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { activities: TogetherActivity[] };
      this.activities.set(data.activities);
    } catch {
      this.error.set('Non sono riuscito a caricare la lista.');
    } finally {
      this.loading.set(false);
    }
  }

  private updateLocalStatus(id: number, status: ActivityStatus): void {
    this.activities.update((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
}
