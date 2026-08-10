import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { StaticContentService } from '../../core/static-content.service';
import { AppShell } from '../../shell/app-shell';
import { ContentMessage } from '../../shared/content-message/content-message';
import { AudioPlayer } from '../../shared/audio-player/audio-player';

// Riconosce i link youtu.be/youtube.com tra i contenuti "external" (Bacheca li mischia a
// link Drive) e li converte nello stesso embed privacy-enhanced già usato da Storie/
// Mappamondo, invece del bottone "Apri il contenuto esterno" generico.
const YOUTUBE_URL_PATTERN = /(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/;

interface Photo {
  key: string;
  thumbKey?: string;
  caption?: string;
}

interface DayItem {
  type: 'photo-group' | 'text' | 'external' | 'video' | 'audio';
  photos?: Photo[];
  text?: string;
  href?: string;
  key?: string;
  label?: string;
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

// Le foto con didascalia diventano blocchi "in evidenza" (grandi, con testo accanto), le
// altre restano un filmino compatto — richiesto dopo la prima versione a griglia uniforme,
// dove le poche foto scelte si perdevano nel mucchio di quelle senza descrizione.
type RenderBlock =
  | { kind: 'photo-group'; leadingText: boolean; text: string; featured: Photo[]; plain: Photo[] }
  | { kind: 'text'; text: string }
  | { kind: 'external'; href: string }
  | { kind: 'youtube'; src: SafeResourceUrl }
  | { kind: 'video'; key: string }
  | { kind: 'audio'; key: string; label: string };

interface DayView {
  id: string;
  title?: string;
  blocks: RenderBlock[];
}

interface PeriodView {
  title: string;
  days: DayView[];
}

interface IndexChip {
  id: string;
  label: string;
}

// Un "incontro" con più giorni (Settembre, Maggio) diventa un gruppo con intestazione +
// una pillola per giorno; un periodo a giorno unico senza titolo (Altre cose, I video) resta
// una pillola singola — prima erano tutti appiattiti nella stessa fila indistinguibile.
interface IndexGroup {
  title: string;
  standalone: boolean;
  chips: IndexChip[];
}

// Porting fedele di assets/js/bacheca/main.js: stessa fonte dati (content/bacheca.json),
// stessa logica di raggruppamento foto/testo (renderDayItems — coppie adiacenti diventano
// un'unica "unit", il resto resta separato), stesso lightbox nativo <dialog> con
// navigazione da tastiera e swipe touch, stesse foto sempre servite da /api/media/<key>
// (mai un percorso statico).
@Component({
  selector: 'app-bacheca',
  standalone: true,
  imports: [AppShell, NgTemplateOutlet, ContentMessage, RouterLink, AudioPlayer],
  styleUrls: ['../../../styles/pages/bacheca.css'],
  templateUrl: './bacheca.html'
})
export class Bacheca implements OnInit, AfterViewInit {
  private readonly staticContent = inject(StaticContentService);
  private readonly sanitizer = inject(DomSanitizer);
  @ViewChild('lightbox') private lightboxRef?: ElementRef<HTMLDialogElement>;

  protected readonly introduction = signal<string[]>([]);
  protected readonly monthGroups = signal<IndexGroup[]>([]);
  protected readonly extraGroups = signal<IndexGroup[]>([]);
  protected readonly periodViews = signal<PeriodView[]>([]);
  protected readonly loadError = signal(false);

  protected readonly activeGallery = signal<Photo[]>([]);
  protected readonly activeIndex = signal(0);
  protected readonly activePhoto = signal<Photo | null>(null);

  private touchStartX: number | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.staticContent.load<BachecaData>('/content/bacheca.json');

      const indexGroups = data.periods.map((period) => this.toIndexGroup(period));
      this.introduction.set(data.introduction);
      this.monthGroups.set(indexGroups.filter((group) => !group.standalone));
      this.extraGroups.set(indexGroups.filter((group) => group.standalone));
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

  private toIndexGroup(period: Period): IndexGroup {
    const standalone = period.days.length === 1 && !period.days[0].title;
    return {
      title: period.title,
      standalone,
      chips: period.days.map((day) => ({
        id: this.sectionId(period.slug, day),
        label: day.title || period.title
      }))
    };
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

  // Stessa logica di renderDayItems: foto+testo adiacenti diventano un unico blocco (in
  // entrambi gli ordini), tutto il resto resta un blocco a sé.
  private buildDayBlocks(items: DayItem[]): RenderBlock[] {
    const blocks: RenderBlock[] = [];

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const next = items[i + 1];

      if (item.type === 'photo-group' && next?.type === 'text') {
        blocks.push(this.toPhotoGroupBlock(item.photos ?? [], false, next.text ?? ''));
        i += 1;
      } else if (item.type === 'text' && next?.type === 'photo-group') {
        blocks.push(this.toPhotoGroupBlock(next.photos ?? [], true, item.text ?? ''));
        i += 1;
      } else if (item.type === 'photo-group') {
        blocks.push(this.toPhotoGroupBlock(item.photos ?? [], false, ''));
      } else if (item.type === 'text') {
        blocks.push({ kind: 'text', text: item.text ?? '' });
      } else if (item.type === 'external' && item.href) {
        const videoId = item.href.match(YOUTUBE_URL_PATTERN)?.[1];
        blocks.push(
          videoId
            ? { kind: 'youtube', src: this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}`) }
            : { kind: 'external', href: item.href }
        );
      } else if (item.type === 'video' && item.key) {
        blocks.push({ kind: 'video', key: item.key });
      } else if (item.type === 'audio' && item.key) {
        blocks.push({ kind: 'audio', key: item.key, label: item.label || 'traccia audio' });
      }
    }

    return blocks;
  }

  private toPhotoGroupBlock(photos: Photo[], leadingText: boolean, text: string): RenderBlock {
    return {
      kind: 'photo-group',
      leadingText,
      text,
      featured: photos.filter((photo) => photo.caption),
      plain: photos.filter((photo) => !photo.caption)
    };
  }
}
