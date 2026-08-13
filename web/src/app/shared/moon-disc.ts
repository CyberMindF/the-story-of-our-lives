import { Component, Input } from '@angular/core';
import { MoonRenderParams, moonRenderParams } from './moon-phase';

// Solo la sfera (disco + ombra a falce/gibbosa), senza posizionamento né dimensione: quelli
// li decide chi la usa (world-moon.ts per lo sfondo, piccola e fissa in un angolo; la pagina
// "Il Cielo" per la versione grande e centrata, #a4) dando al proprio contenitore la
// larghezza/altezza desiderata — .moon-disc riempie sempre il 100% di quel contenitore.
@Component({
  selector: 'app-moon-disc',
  standalone: true,
  styleUrls: ['../../styles/components/moon-disc.css'],
  templateUrl: './moon-disc.html'
})
export class MoonDisc {
  @Input({ required: true }) phaseFraction!: number;
  // Tema chiaro (#e13): stesso posizionamento/dimensione della luna, ma disco pieno dorato
  // senza fasi — il sole non ha fasi da mostrare.
  @Input() isSun = false;

  protected render(): MoonRenderParams {
    return moonRenderParams(this.phaseFraction);
  }
}
