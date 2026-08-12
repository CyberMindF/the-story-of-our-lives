import { AfterViewInit, Component, DestroyRef, ElementRef, effect, inject, viewChild } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAspect;

  float noise(vec2 coordinate) {
    const float e = 2.718281828459045;
    vec2 r = e * sin(e * coordinate);
    return fract(r.x * r.y * (1.0 + coordinate.x));
  }

  mat2 rotate2d(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= uAspect;
    vec2 tex = rotate2d(-0.12) * (uv * 1.02);
    float offset = 4.2 * uTime;
    tex.y += 0.035 * sin(8.0 * tex.x - offset);

    float folds = 0.6 + 0.4 * sin(
      3.3 * (tex.x + tex.y + cos(2.0 * tex.x + 3.2 * tex.y) + 0.02 * offset)
      + sin(10.0 * (tex.x + tex.y - 0.1 * offset))
    );
    float grain = noise(gl_FragCoord.xy) / 42.0;
    // Trama neutra: con soft-light modifica solo luci e ombre dello sfondo,
    // senza sovrapporgli un nuovo colore.
    float shade = mix(0.16, 0.69, folds) - grain;
    gl_FragColor = vec4(vec3(shade), 0.58);
  }
`;

@Component({ selector: 'app-world-silk', standalone: true, templateUrl: './world-silk.html' })
export class WorldSilk implements AfterViewInit {
  protected readonly worldSettingsService = inject(WorldSettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private animationFrame = 0;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private startedAt = performance.now();
  private reducedMotion = false;

  constructor() {
    effect(() => {
      const enabled = this.worldSettingsService.settings().silk;
      queueMicrotask(() => enabled ? this.start() : this.stop());
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvas()?.nativeElement;
    if (!canvas) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!this.gl) {
      canvas.classList.add('is-fallback');
      return;
    }

    this.program = this.createProgram(this.gl);
    if (!this.program) {
      canvas.classList.add('is-fallback');
      return;
    }

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);
    const position = this.gl.getAttribLocation(this.program, 'aPosition');
    this.gl.enableVertexAttribArray(position);
    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0);

    const resize = () => this.resize(canvas);
    const visibility = () => document.hidden ? this.stop() : this.start();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    this.destroyRef.onDestroy(() => {
      this.stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      if (buffer) this.gl?.deleteBuffer(buffer);
      if (this.program) this.gl?.deleteProgram(this.program);
    });

    resize();
    if (this.worldSettingsService.settings().silk) this.start();
  }

  private createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Impossibile compilare lo shader della seta:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Impossibile collegare lo shader della seta:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  private resize(canvas: HTMLCanvasElement): void {
    if (!this.gl) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(window.innerWidth * ratio));
    const height = Math.max(1, Math.round(window.innerHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
    if (this.reducedMotion) this.render(0);
  }

  private start(): void {
    if (this.animationFrame || !this.gl || !this.program) return;
    if (this.reducedMotion) {
      this.render(0);
      return;
    }
    const frame = (now: number) => {
      this.animationFrame = requestAnimationFrame(frame);
      this.render((now - this.startedAt) / 1000 * 0.1);
    };
    this.animationFrame = requestAnimationFrame(frame);
  }

  private stop(): void {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  private render(time: number): void {
    if (!this.gl || !this.program) return;
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'uTime'), time);
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'uAspect'), this.gl.canvas.width / this.gl.canvas.height);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
