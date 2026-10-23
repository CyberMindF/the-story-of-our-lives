import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';

// Mantiene la miniatura leggera finché la foto è lontana. Quando entra nella fascia vicina
// al viewport precarica l'originale e lo sostituisce soltanto dopo che è pronto, evitando sia
// il caricamento dell'intera Bacheca sia il lampo vuoto durante il cambio di sorgente.
@Directive({
  selector: 'img[appViewportFullImage]',
  standalone: true
})
export class ViewportFullImage implements AfterViewInit, OnDestroy {
  @Input({ required: true }) appViewportFullImage = '';

  private observer: IntersectionObserver | null = null;
  private preloader: HTMLImageElement | null = null;
  private destroyed = false;

  constructor(private readonly elementRef: ElementRef<HTMLImageElement>) {}

  ngAfterViewInit(): void {
    const image = this.elementRef.nativeElement;
    if (!this.appViewportFullImage || image.getAttribute('src') === this.appViewportFullImage) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      this.loadFullImage();
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer?.disconnect();
        this.observer = null;
        this.loadFullImage();
      },
      { rootMargin: '800px 0px' }
    );
    this.observer.observe(image);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    if (this.preloader) {
      this.preloader.onload = null;
      this.preloader.onerror = null;
    }
  }

  private loadFullImage(): void {
    const fullImageUrl = this.appViewportFullImage;
    const preloader = new Image();
    this.preloader = preloader;
    preloader.decoding = 'async';
    preloader.onload = () => {
      if (!this.destroyed && fullImageUrl === this.appViewportFullImage) {
        this.elementRef.nativeElement.src = fullImageUrl;
      }
      this.preloader = null;
    };
    preloader.onerror = () => {
      this.preloader = null;
    };
    preloader.src = fullImageUrl;
  }
}
