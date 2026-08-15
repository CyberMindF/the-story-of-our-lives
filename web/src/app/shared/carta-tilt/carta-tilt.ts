import { AfterViewChecked, Component, ElementRef, HostBinding, HostListener, Input, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { MetallicFoil } from '../metallic-foil/metallic-foil';
import { HOLO_PALETTES, HoloFragment, computeFragmentStyle, getHoloFragments } from './holo-mosaic';
import { MetalPreset } from '../metallic-foil/metal-palette';

export type CartaFinitura = 'flat' | 'argento' | 'oro' | 'smeraldo' | 'rubino' | 'zaffiro' | 'diamante';
type CartaFinituraGemma = 'smeraldo' | 'rubino' | 'zaffiro' | 'diamante';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Tilt 3D continuo + foil, con due effetti visivi DIVERSI a seconda della finitura (richiesto
// esplicitamente da Rory, non intercambiabili):
// - Metalli (oro, argento): superficie liscia continua, componente <app-metallic-foil> a sé
//   (preset 'gold'/'silver', vedi metal-palette.ts), niente frammenti.
// - Pietre (smeraldo/rubino/zaffiro/diamante): mosaico olografico "crushed ice" costruito qui
//   stesso con poligoni SVG (vedi holo-mosaic.ts per la fisica della luce per-frammento).
//   Pattern geometrico SEMPRE fisso, cambia solo il colore di ciascun frammento in base alla
//   propria normale ottica rispetto al mouse — non un riflettore che insegue il cursore né una
//   trama che si sposta (entrambe bocciate in versioni precedenti).
//
// Le centinaia di aggiornamenti fill/opacity durante il pointermove scrivono direttamente sugli
// attributi SVG e sulle CSS custom property del tilt (bypassando i binding di Angular, dentro
// NgZone.runOutsideAngular): farli passare dal change detection di Angular a ogni mossa del
// mouse sarebbe molto più lento con centinaia di poligoni per carta.
@Component({
  selector: 'app-carta-tilt',
  standalone: true,
  imports: [MetallicFoil],
  styleUrl: './carta-tilt.css',
  templateUrl: './carta-tilt.html'
})
export class CartaTilt implements AfterViewChecked, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);

  @Input({ required: true }) finitura: CartaFinitura = 'flat';
  @Input() immagineUrl: string | null = null;
  @Input() nome = '';

  @ViewChild('frame', { static: true }) private readonly frameRef!: ElementRef<HTMLElement>;
  @ViewChild('foilSvg') private readonly foilSvgRef?: ElementRef<SVGSVGElement>;

  @HostBinding('class.carta-tilt-host') readonly hostClass = true;

  // Getter, non un campo di classe: un campo inizializzato subito leggerebbe this.finitura
  // PRIMA che Angular assegni il valore reale dell'@Input (i campi di classe si valutano nel
  // costruttore, gli @Input vengono impostati solo dopo) — risultato: sempre false, niente
  // mosaico mai renderizzato. Bug reale, trovato testando: 0 poligoni nel DOM.
  protected get isMetallo(): boolean {
    return this.finitura === 'argento' || this.finitura === 'oro';
  }

  protected get metalPreset(): MetalPreset {
    return this.finitura === 'argento' ? 'silver' : 'gold';
  }

  protected get isGemma(): boolean {
    return this.finitura === 'smeraldo' || this.finitura === 'rubino' || this.finitura === 'zaffiro' || this.finitura === 'diamante';
  }

  private get palette() {
    return this.isGemma ? HOLO_PALETTES[this.finitura as CartaFinituraGemma] : undefined;
  }

  private static readonly MAX_ANGLE = 16;
  private static readonly REST_LIGHT: readonly [number, number] = [0.35, 0.28];

  private fragmentElements: SVGPolygonElement[] = [];
  private fragments: HoloFragment[] = [];
  // Per quale finitura sono attualmente colorati i poligoni nell'SVG corrente — non "se" sono
  // stati costruiti, ma "per cosa": serve a distinguere i due casi che altrimenti si
  // confondono con un semplice flag booleano (vedi sotto).
  private finituraCostruita?: CartaFinitura;

  // ngAfterViewChecked invece di ngAfterViewInit: con due @for che iterano sullo stesso
  // elenco di carte in punti diversi del template (album "mio" e "dell'altro"), le istanze di
  // CartaTilt del SECONDO blocco non ricevevano mai la chiamata a ngAfterViewInit — bug
  // verificato con un log diagnostico (0 chiamate registrate per quelle istanze, DOM comunque
  // presente ma mosaico mai costruito). Non individuata la causa esatta lato Angular;
  // ngAfterViewChecked (che gira ad ogni ciclo di change detection, non solo una volta) è una
  // rete di sicurezza robusta indipendente da quella causa.
  //
  // Due situazioni distinte da gestire qui, non una sola ("già costruito sì/no"):
  // 1. SVG vuoto (0 figli): o è la primissima costruzione, o Angular ha appena ricreato
  //    l'elemento perché la carta è passata da un'altra finitura (oro/flat) a una gemma —
  //    serve costruire la geometria dei poligoni da zero.
  // 2. SVG già pieno MA per una finitura diversa da quella attuale: Angular riusa la stessa
  //    istanza e lo stesso <svg> quando si passa da una finitura gemma a un'altra (es. rubino
  //    → smeraldo) restando nello stesso punto della griglia (stesso design, stesso track
  //    key) — la geometria dei triangoli è identica per ogni gemma, cambia solo la palette,
  //    quindi basta ricolorare gli stessi poligoni, non ricrearli. Il primo giro di questo fix
  //    (un flag "costruito: sì/no" per sempre) non gestiva questo secondo caso: lasciava i
  //    colori della finitura precedente sui poligoni già esistenti — è il bug del "fantasma
  //    rubino dentro l'album smeraldo" segnalato da Rory.
  ngAfterViewChecked(): void {
    if (!this.isGemma || !this.foilSvgRef) return;
    const svg = this.foilSvgRef.nativeElement;

    if (svg.childElementCount === 0) {
      this.finituraCostruita = this.finitura;
      this.zone.runOutsideAngular(() => this.buildMosaic());
      return;
    }

    if (this.finituraCostruita !== this.finitura) {
      this.finituraCostruita = this.finitura;
      this.zone.runOutsideAngular(() => this.renderFoil(...CartaTilt.REST_LIGHT));
    }
  }

  ngOnDestroy(): void {
    this.fragmentElements = [];
  }

  private buildMosaic(): void {
    const svg = this.foilSvgRef!.nativeElement;
    this.fragments = getHoloFragments();

    const docFragment = document.createDocumentFragment();
    this.fragmentElements = this.fragments.map((frag) => {
      const [x1, y1, x2, y2, x3, y3] = frag.points;
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
      docFragment.appendChild(polygon);
      return polygon;
    });
    svg.appendChild(docFragment);

    this.renderFoil(...CartaTilt.REST_LIGHT);
  }

  private renderFoil(lightX: number, lightY: number): void {
    if (!this.palette) return;
    for (let i = 0; i < this.fragments.length; i++) {
      const style = computeFragmentStyle(this.fragments[i], this.palette, lightX, lightY);
      const el = this.fragmentElements[i];
      el.setAttribute('fill', style.fill);
      el.setAttribute('opacity', style.opacity.toFixed(3));
    }
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    this.zone.runOutsideAngular(() => {
      const rotateX = -(py - 0.5) * CartaTilt.MAX_ANGLE * 2;
      const rotateY = (px - 0.5) * CartaTilt.MAX_ANGLE * 2;
      const frame = this.frameRef.nativeElement;
      frame.style.setProperty('--rx', `${rotateX}deg`);
      frame.style.setProperty('--ry', `${rotateY}deg`);
      frame.style.setProperty('--mx', `${px * 100}%`);
      frame.style.setProperty('--my', `${py * 100}%`);
      frame.classList.add('is-active');

      if (this.isGemma) this.renderFoil(px, py);
    });
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.zone.runOutsideAngular(() => {
      const frame = this.frameRef.nativeElement;
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
      // --mx/--my pilotano anche .carta-tilt-gloss (lucido plastica, background-position):
      // senza questo reset restavano ferme all'ultima posizione del mouse invece di tornare al
      // centro, la striscia di luce restava "bloccata" invece di rientrare (segnalato da Rory).
      frame.style.setProperty('--mx', `${CartaTilt.REST_LIGHT[0] * 100}%`);
      frame.style.setProperty('--my', `${CartaTilt.REST_LIGHT[1] * 100}%`);
      frame.classList.remove('is-active');

      if (this.isGemma) this.renderFoil(...CartaTilt.REST_LIGHT);
    });
  }

  protected get backgroundImage(): string {
    return this.immagineUrl ? `url("${this.immagineUrl}")` : 'none';
  }

  protected get tintStyle(): string {
    if (!this.palette) return 'none';
    const [r, g, b] = this.palette.base;
    return `linear-gradient(rgba(${r},${g},${b},.28), rgba(${r},${g},${b},.28))`;
  }
}
