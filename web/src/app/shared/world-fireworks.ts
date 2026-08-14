import { Component, ElementRef, OnDestroy, OnInit, ViewChild, effect, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';

// Ispirato all'idea (non al codice) di un motore fireworks su <canvas> trovato da Rory: qui è
// riscritto da zero, molto più piccolo (niente audio/menu/qualità regolabile/localStorage), ma
// tiene la parte che dava davvero la resa "vera": gravità, attrito nell'aria, scie che restano
// visibili qualche fotogramma invece di un singolo segmento istantaneo, bagliore vero (shadowBlur,
// non solo un colore pieno), scintille secondarie ("glitter") che si staccano dalle stelle
// principali, e il lampo bianco dell'esplosione — la prima versione (solo linea nuda da un
// fotogramma all'altro) sembrava spenta rispetto al riferimento proprio perché mancava tutto
// questo, non per il canvas in sé.
const COLORS = ['#ff3b57', '#28e070', '#3f8fff', '#d24bff', '#ffbf36', '#ffffff'];
const GRAVITY = 0.045;
const DRAG = 0.988;
const TRAIL_LENGTH = 5;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface Star {
  x: number;
  y: number;
  trail: { x: number; y: number }[];
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  fullLife: number;
  size: number;
  glitter: boolean;
  glitterTimer: number;
  crackleTimer: number | null;
}

interface Glitter {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  fullLife: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  speedY: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Flash {
  x: number;
  y: number;
  life: number;
  fullLife: number;
  size: number;
}

function pick<T>(arr: readonly T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

@Component({
  selector: 'app-world-fireworks',
  standalone: true,
  templateUrl: './world-fireworks.html'
})
export class WorldFireworks implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  protected readonly worldSettingsService = inject(WorldSettingsService);

  private ctx: CanvasRenderingContext2D | null = null;
  private stars: Star[] = [];
  private glitters: Glitter[] = [];
  private rockets: Rocket[] = [];
  private flashes: Flash[] = [];
  private frameHandle = 0;
  private launchTimer = 0;
  private lastFrameTime = 0;
  private running = false;
  private resizeListener?: () => void;
  private readonly prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;

  // Segue l'interruttore condiviso: parte/si ferma senza bisogno che la pagina venga ricaricata.
  private readonly settingsEffect = effect(() => {
    const enabled = this.worldSettingsService.settings().fireworks && !this.prefersReducedMotion;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  });

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resizeListener = () => this.resize();
    window.addEventListener('resize', this.resizeListener);
    this.resize();
  }

  ngOnDestroy(): void {
    this.stop();
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    this.settingsEffect.destroy();
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private start(): void {
    if (this.running || !this.ctx) return;
    this.running = true;
    this.launchTimer = 0;
    this.lastFrameTime = performance.now();
    this.frameHandle = requestAnimationFrame((t) => this.tick(t));
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
    this.stars = [];
    this.glitters = [];
    this.rockets = [];
    this.flashes = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
  }

  private tick(now: number): void {
    if (!this.running || !this.ctx) return;
    const dt = Math.min(now - this.lastFrameTime, 48);
    this.lastFrameTime = now;
    const speed = dt / 16.6;

    this.launchTimer -= dt;
    if (this.launchTimer <= 0) {
      this.launchRocket();
      this.launchTimer = randomBetween(600, 1600);
    }

    this.updateRockets(speed);
    this.updateStars(speed);
    this.updateGlitters(speed);
    this.updateFlashes(dt);
    this.render();

    this.frameHandle = requestAnimationFrame((t) => this.tick(t));
  }

  private launchRocket(): void {
    const canvas = this.canvasRef.nativeElement;
    const x = randomBetween(canvas.width * 0.12, canvas.width * 0.88);
    const targetY = randomBetween(canvas.height * 0.14, canvas.height * 0.48);
    this.rockets.push({
      x,
      y: canvas.height,
      targetY,
      speedY: randomBetween(-9.5, -8),
      color: Math.random() < 0.5 ? '#fff4d6' : pick(COLORS),
      trail: []
    });
  }

  private updateRockets(speed: number): void {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.trail.push({ x: rocket.x, y: rocket.y });
      if (rocket.trail.length > 8) rocket.trail.shift();

      rocket.y += rocket.speedY * speed;
      rocket.speedY += GRAVITY * 0.6 * speed;

      if (rocket.y <= rocket.targetY || rocket.speedY >= 0) {
        this.explode(rocket.x, rocket.y);
        this.rockets.splice(i, 1);
      }
    }
  }

  // Cinque forme di esplosione, come nei fuochi veri: crisantemo (raggiera piena, a volte due
  // colori), ad anello (solo il bordo, velocità quasi uguale per tutte le stelle così restano
  // "in formazione"), con un pistillo centrale di un secondo colore, a salice (dorata, poche
  // stelle lente che si arcuano e cadono a lungo invece di spegnersi subito), e crepitante
  // (dorata/bianca, ogni stella "scoppietta" una volta durante il volo con un piccolo pop di
  // scintille — sfasato in modo casuale per stella, così il crepitio si sente diffuso nel
  // tempo invece che tutto insieme). Un lampo bianco breve segna il momento del "botto",
  // altrimenti l'esplosione sembra partire già a piena luminosità senza un vero picco iniziale.
  private explode(x: number, y: number): void {
    const shape = Math.random();
    const isWillow = shape < 0.14;
    const isCrackle = !isWillow && shape < 0.32;
    const isRing = !isWillow && !isCrackle && shape < 0.5;
    const color = pick(COLORS);
    const secondColor = Math.random() < 0.35 ? pick(COLORS.filter((c) => c !== color)) : color;
    const hasPistil = Math.random() < 0.4;

    if (isWillow) {
      const count = Math.floor(randomBetween(22, 32));
      const willowColor = Math.random() < 0.6 ? '#ffbf36' : '#fff4d6';
      this.flashes.push({ x, y, life: 220, fullLife: 220, size: 28 });
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + randomBetween(-0.1, 0.1);
        this.stars.push(this.createStar(x, y, angle, randomBetween(1.2, 2.6), willowColor, 2.2, true));
      }
      return;
    }

    if (isCrackle) {
      const count = Math.floor(randomBetween(40, 58));
      const crackleColor = Math.random() < 0.7 ? '#ffbf36' : '#ffffff';
      this.flashes.push({ x, y, life: 220, fullLife: 220, size: 30 });
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + randomBetween(-0.06, 0.06);
        this.stars.push(this.createStar(x, y, angle, randomBetween(2, 4.4), crackleColor, 1, false, true));
      }
      return;
    }

    const count = isRing ? 36 : Math.floor(randomBetween(46, 66));
    this.flashes.push({ x, y, life: 220, fullLife: 220, size: isRing ? 26 : 34 });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + randomBetween(-0.05, 0.05);
      const burstSpeed = isRing ? randomBetween(4.6, 5.2) : randomBetween(1.6, 5.6);
      this.stars.push(this.createStar(x, y, angle, burstSpeed, i % 2 === 0 ? color : secondColor));
    }

    if (hasPistil && !isRing) {
      const pistilColor = color === '#ffffff' ? pick(COLORS) : '#ffffff';
      const pistilCount = 22;
      for (let i = 0; i < pistilCount; i++) {
        const angle = (i / pistilCount) * Math.PI * 2;
        this.stars.push(this.createStar(x, y, angle, randomBetween(0.6, 1.8), pistilColor, 0.6));
      }
    }
  }

  private createStar(x: number, y: number, angle: number, burstSpeed: number, color: string, lifeScale = 1, forceGlitter = false, crackle = false): Star {
    const fullLife = randomBetween(820, 1200) * lifeScale;
    return {
      x,
      y,
      trail: [{ x, y }],
      speedX: Math.cos(angle) * burstSpeed,
      speedY: Math.sin(angle) * burstSpeed,
      color,
      life: fullLife,
      fullLife,
      size: randomBetween(1.3, 2.4),
      glitter: forceGlitter || Math.random() < 0.18,
      glitterTimer: randomBetween(0, 90),
      // Il "pop" arriva in un istante casuale durante il volo (non subito, non alla fine): un
      // crepitio vero è sfasato stella per stella, non un colpo unico.
      crackleTimer: crackle ? randomBetween(fullLife * 0.15, fullLife * 0.75) : null
    };
  }

  private updateStars(speed: number): void {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      star.life -= 16.6 * speed;
      if (star.life <= 0) {
        this.stars.splice(i, 1);
        continue;
      }
      star.x += star.speedX * speed;
      star.y += star.speedY * speed;
      star.speedX *= DRAG;
      star.speedY *= DRAG;
      star.speedY += GRAVITY * speed;

      star.trail.push({ x: star.x, y: star.y });
      if (star.trail.length > TRAIL_LENGTH) star.trail.shift();

      // Crepitio: un solo "pop" per stella, un piccolo scoppio di scintille in ogni direzione
      // nell'istante scelto alla nascita — poi la stella prosegue il suo volo come le altre.
      if (star.crackleTimer !== null) {
        star.crackleTimer -= 16.6 * speed;
        if (star.crackleTimer <= 0) {
          star.crackleTimer = null;
          const popCount = Math.floor(randomBetween(4, 7));
          for (let p = 0; p < popCount; p++) {
            const popAngle = randomBetween(0, Math.PI * 2);
            const popSpeed = randomBetween(0.8, 2.2);
            this.glitters.push({
              x: star.x,
              y: star.y,
              speedX: star.speedX * 0.2 + Math.cos(popAngle) * popSpeed,
              speedY: star.speedY * 0.2 + Math.sin(popAngle) * popSpeed,
              color: star.color,
              life: randomBetween(140, 260),
              fullLife: 260
            });
          }
        }
      }

      // "Glitter": piccole scintille secondarie che si staccano ogni tanto da una stella su
      // due — è ciò che nei fuochi veri dà l'aspetto scintillante, non solo la riga piena.
      if (star.glitter) {
        star.glitterTimer -= 16.6 * speed;
        if (star.glitterTimer <= 0 && star.life > star.fullLife * 0.15) {
          star.glitterTimer = randomBetween(70, 140);
          this.glitters.push({
            x: star.x,
            y: star.y,
            speedX: star.speedX * 0.3 + randomBetween(-0.6, 0.6),
            speedY: star.speedY * 0.3 + randomBetween(-0.6, 0.6),
            color: star.color,
            life: randomBetween(160, 320),
            fullLife: 320
          });
        }
      }
    }
  }

  private updateGlitters(speed: number): void {
    for (let i = this.glitters.length - 1; i >= 0; i--) {
      const glitter = this.glitters[i];
      glitter.life -= 16.6 * speed;
      if (glitter.life <= 0) {
        this.glitters.splice(i, 1);
        continue;
      }
      glitter.x += glitter.speedX * speed;
      glitter.y += glitter.speedY * speed;
      glitter.speedY += GRAVITY * 0.5 * speed;
    }
  }

  private updateFlashes(dt: number): void {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].life -= dt;
      if (this.flashes[i].life <= 0) this.flashes.splice(i, 1);
    }
  }

  // Niente `shadowBlur`: è un filtro ricalcolato per ogni forma disegnata, ed è quello che
  // faceva "laggare" la pagina con centinaia di stelle attive insieme. Il codice di
  // riferimento di Rory infatti non lo usa mai — il suo bagliore viene dal blend mode
  // `lighten` tra due canvas sovrapposti (tanti tratti chiari che si sommano), non da un blur
  // per singola forma. Qui lo stesso principio si ottiene con `globalCompositeOperation =
  // 'lighter'` (economico) e un solo `stroke()` per stella (l'intera scia in un unico path),
  // invece di un `beginPath`/`stroke` per ogni segmento.
  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas = this.canvasRef.nativeElement;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const rocket of this.rockets) {
      if (rocket.trail.length < 2) continue;
      ctx.strokeStyle = rocket.color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y);
      for (const point of rocket.trail) ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';

    for (const star of this.stars) {
      if (star.trail.length < 2) continue;
      const fade = Math.max(star.life / star.fullLife, 0);
      ctx.strokeStyle = star.color;
      ctx.lineWidth = star.size;
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.moveTo(star.trail[0].x, star.trail[0].y);
      for (let i = 1; i < star.trail.length; i++) ctx.lineTo(star.trail[i].x, star.trail[i].y);
      ctx.stroke();
    }

    if (this.glitters.length) {
      ctx.fillStyle = '#fff8e8';
      for (const glitter of this.glitters) {
        const fade = Math.max(glitter.life / glitter.fullLife, 0);
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(glitter.x, glitter.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const flash of this.flashes) {
      const fade = Math.max(flash.life / flash.fullLife, 0);
      ctx.globalAlpha = fade * 0.85;
      const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.size);
      gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
