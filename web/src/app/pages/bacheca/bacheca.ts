import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';

interface Photo {
  key: string;
  thumbKey?: string;
  caption?: string;
}

interface DayItem {
  type: 'photo-group' | 'text' | 'external';
  photos?: Photo[];
  text?: string;
  href?: string;
}

interface Day {
  slug: string;
  title?: string;
  items: DayItem[];
}

interface Period {
  slug: string;
  title: string;
  days: Day[];
}

interface BachecaData {
  introduction: string[];
  periods: Period[];
}

type RenderBlock =
  | { kind: 'unit'; leadingText: boolean; photos: Photo[]; text: string }
  | { kind: 'photo-grid'; photos: Photo[] }
  | { kind: 'text'; text: string }
  | { kind: 'external'; href: string };

interface DayView {
  id: string;
  title?: string;
  blocks: RenderBlock[];
}

interface PeriodView {
  title: string;
  days: DayView[];
}

interface IndexLink {
  id: string;
  label: string;
}

// Porting fedele di assets/js/bacheca/main.js: stessa fonte dati (content/bacheca.json),
// stessa logica di raggruppamento foto/testo (renderDayItems — coppie adiacenti diventano
// un'unica "unit", il resto resta separato), stesso lightbox nativo <dialog> con
// navigazione da tastiera e swipe touch, stesse foto sempre servite da /api/media/<key>
// (mai un percorso statico).
@Component({
  selector: 'app-bacheca',
  standalone: true,
  imports: [AppShell, NgTemplateOutlet, ContentMessage],
  styleUrls: ['../../../styles/pages/bacheca.css'],
  templateUrl: './bacheca.html'
})
export class Bacheca implements OnInit, AfterViewInit {
  @ViewChild('lightbox') private lightboxRef?: ElementRef<HTMLDialogElement>;

  protected readonly introduction = signal<string[]>([]);
  protected readonly indexLinks = signal<IndexLink[]>([]);
  protected readonly periodViews = signal<PeriodView[]>([]);
  protected readonly loadError = signal(false);

  protected readonly activeGallery = signal<Photo[]>([]);
  protected readonly activeIndex = signal(0);
  protected readonly activePhoto = signal<Photo | null>(null);

  private touchStartX: number | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('/content/bacheca.json');
      if (!response.ok) {
        throw new Error(`Caricamento fallito: ${response.status}`);
      }
      const data = (await response.json()) as BachecaData;

      this.introduction.set(data.introduction);
      this.indexLinks.set(this.buildIndexLinks(data.periods));
      this.periodViews.set(data.periods.map((period) => this.toPeriodView(period)));

      const requestedSection = window.location.hash.slice(1);
      if (requestedSection) {
        requestAnimationFrame(() => document.getElementById(requestedSection)?.scrollIntoView());
      }
    } catch (error) {
      console.error('Errore nel caricamento della Bacheca:', error);
      this.loadError.set(true);
    }
  }

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

  protected openLightbox(gallery: Photo[], index: number): void {
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

  private sectionId(periodSlug: string, day: Day): string {
    return day.slug === 'generale' ? periodSlug : `${periodSlug}-${day.slug}`;
  }

  private buildIndexLinks(periods: Period[]): IndexLink[] {
    return periods.flatMap((period) =>
      period.days.map((day) => ({
        id: this.sectionId(period.slug, day),
        label: day.title ? `${period.title} · ${day.title}` : period.title
      }))
    );
  }

  private toPeriodView(period: Period): PeriodView {
    return {
      title: period.title,
      days: period.days.map((day) => ({
        id: this.sectionId(period.slug, day),
        title: day.title,
        blocks: this.buildDayBlocks(day.items)
      }))
    };
  }

  // Stessa logica di renderDayItems: foto+testo adiacenti diventano un'unica "unit" (in
  // entrambi gli ordini), tutto il resto resta un blocco a sé.
  private buildDayBlocks(items: DayItem[]): RenderBlock[] {
    const blocks: RenderBlock[] = [];

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const next = items[i + 1];

      if (item.type === 'photo-group' && next?.type === 'text') {
        blocks.push({ kind: 'unit', leadingText: false, photos: item.photos ?? [], text: next.text ?? '' });
        i += 1;
      } else if (item.type === 'text' && next?.type === 'photo-group') {
        blocks.push({ kind: 'unit', leadingText: true, photos: next.photos ?? [], text: item.text ?? '' });
        i += 1;
      } else if (item.type === 'photo-group') {
        blocks.push({ kind: 'photo-grid', photos: item.photos ?? [] });
      } else if (item.type === 'text') {
        blocks.push({ kind: 'text', text: item.text ?? '' });
      } else if (item.type === 'external' && item.href) {
        blocks.push({ kind: 'external', href: item.href });
      }
    }

    return blocks;
  }
}
