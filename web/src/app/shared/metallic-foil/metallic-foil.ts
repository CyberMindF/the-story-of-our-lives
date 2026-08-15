import { Component, ElementRef, HostListener, Input, NgZone, inject } from '@angular/core';
import { METAL_PRESETS, MetalPalette, MetalPreset, metalPaletteFromColor } from './metal-palette';

// Foil metallico (superficie continua) — componente a sé, indipendente dal mosaico
// olografico "crushed ice" (<app-carta-tilt> per le finiture pietrose usa quello, non questo).
//
// Riscritto da zero (v2): la prima versione aveva una texture di base FERMA e sopra una banda
// di riflesso che si muoveva da sola col mouse — Rory l'ha bocciata perché si vedevano due
// cose slegate ("texture fissa" + "linea di luce indipendente sopra"), non una lastra di
// metallo unica che reagisce. Qui c'è UN SOLO strato di colore (bande scure/chiare comprese,
// non solo il punto più luminoso) che si sposta tutto insieme in base all'inclinazione: quando
// la carta gira, è l'intera superficie a sembrare catturare la luce in modo diverso, non un
// riflesso che le scivola sopra come un'entità a parte. Niente più hotspot puntuale che segue
// il cursore (bocciato esplicitamente): l'unico movimento è quello dell'intera lastra.
@Component({
  selector: 'app-metallic-foil',
  standalone: true,
  styleUrl: './metallic-foil.css',
  templateUrl: './metallic-foil.html'
})
export class MetallicFoil {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  @Input() preset: MetalPreset = 'gold';
  @Input() color?: string;
  @Input() immagineUrl: string | null = null;
  @Input() interactive = true;

  protected get palette(): MetalPalette {
    return this.color ? metalPaletteFromColor(this.color) : METAL_PRESETS[this.preset];
  }

  protected get backgroundImage(): string {
    return this.immagineUrl ? `url("${this.immagineUrl}")` : 'none';
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (!this.interactive) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    this.zone.runOutsideAngular(() => {
      const el = this.host.nativeElement;
      // Un solo parametro di posizione per l'intera lastra: niente più --mouse-x/--mouse-y
      // separati per riflesso/hotspot che potevano muoversi in modo percepito come slegato.
      el.style.setProperty('--surface-x', `${x * 100}%`);
      el.style.setProperty('--surface-y', `${y * 100}%`);
      el.classList.add('is-active');
    });
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    if (!this.interactive) return;
    this.zone.runOutsideAngular(() => {
      const el = this.host.nativeElement;
      el.style.setProperty('--surface-x', '38%');
      el.style.setProperty('--surface-y', '30%');
      el.classList.remove('is-active');
    });
  }
}
