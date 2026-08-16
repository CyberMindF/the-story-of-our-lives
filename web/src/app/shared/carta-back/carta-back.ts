import { Component, ElementRef, HostListener, NgZone, ViewChild, inject } from '@angular/core';
import { applyCartaPointer, cartaPointerPosition, resetCartaPointer } from '../carta-pointer';

// Retro universale: non riceve la finitura di proposito. Durante l'apertura non deve
// anticipare se la carta nascosta sara' di plastica, metallo o gemma.
@Component({
  selector: 'app-carta-back',
  standalone: true,
  templateUrl: './carta-back.html',
  styleUrl: './carta-back.css'
})
export class CartaBack {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  @ViewChild('frame', { static: true }) private readonly frameRef!: ElementRef<HTMLElement>;

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    const [x, y] = cartaPointerPosition(event, this.host.nativeElement);
    this.zone.runOutsideAngular(() => applyCartaPointer(this.frameRef.nativeElement, x, y));
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.zone.runOutsideAngular(() => resetCartaPointer(this.frameRef.nativeElement));
  }
}
