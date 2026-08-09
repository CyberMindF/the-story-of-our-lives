// Porting fedele, funzione per funzione, della parte di assets/js/crossword/main.js dedicata
// allo scroll animato (animateScrollTo e tutto quello che le serve). Isolate qui come funzioni
// pure/DOM-generiche perché non dipendono da stato Angular — usate da CrosswordGrid per
// centrare la cella attiva sia nel proprio scroller sia nella pagina.
export type ScrollTarget = Window | HTMLElement;

const SCROLL_MIN_DURATION = 180;
const SCROLL_MAX_DURATION = 520;
const SCROLL_MS_PER_PIXEL = 0.9;
const scrollAnimations = new WeakMap<ScrollTarget, { frame: number; startTime: number }>();

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getScrollPosition(target: ScrollTarget): { left: number; top: number } {
  if (target === window) {
    return { left: window.scrollX, top: window.scrollY };
  }
  const element = target as HTMLElement;
  return { left: element.scrollLeft, top: element.scrollTop };
}

export function getScrollLimits(target: ScrollTarget): { left: number; top: number } {
  const element = target === window ? document.documentElement : (target as HTMLElement);
  return {
    left: Math.max(0, element.scrollWidth - element.clientWidth),
    top: Math.max(0, element.scrollHeight - element.clientHeight)
  };
}

function applyScrollPosition(target: ScrollTarget, left: number, top: number): void {
  if (target === window) {
    window.scrollTo(left, top);
    return;
  }
  const element = target as HTMLElement;
  element.scrollLeft = left;
  element.scrollTop = top;
}

export function cancelScrollAnimation(target: ScrollTarget): void {
  const animation = scrollAnimations.get(target);
  if (animation) {
    cancelAnimationFrame(animation.frame);
    scrollAnimations.delete(target);
  }
}

// Un tween proprio invece di scrollTo({behavior:"smooth"}): riprogrammandolo a ogni lettera la
// corsa riparte dalla posizione corrente con una durata proporzionale alla distanza, quindi
// digitando in fretta la griglia continua a seguire il cursore invece di rincorrerlo.
export function animateScrollTo(target: ScrollTarget, left: number, top: number): void {
  const limits = getScrollLimits(target);
  const start = getScrollPosition(target);
  const endLeft = clampNumber(left, 0, limits.left);
  const endTop = clampNumber(top, 0, limits.top);
  const deltaLeft = endLeft - start.left;
  const deltaTop = endTop - start.top;

  cancelScrollAnimation(target);

  if (Math.abs(deltaLeft) < 1 && Math.abs(deltaTop) < 1) {
    return;
  }

  if (prefersReducedMotion()) {
    applyScrollPosition(target, endLeft, endTop);
    return;
  }

  const distance = Math.hypot(deltaLeft, deltaTop);
  const duration = clampNumber(distance * SCROLL_MS_PER_PIXEL, SCROLL_MIN_DURATION, SCROLL_MAX_DURATION);
  const animation = { frame: 0, startTime: 0 };

  const step = (now: number) => {
    if (!animation.startTime) {
      animation.startTime = now;
    }

    const progress = clampNumber((now - animation.startTime) / duration, 0, 1);
    const eased = easeOutCubic(progress);
    applyScrollPosition(target, start.left + deltaLeft * eased, start.top + deltaTop * eased);

    if (progress < 1) {
      animation.frame = requestAnimationFrame(step);
      return;
    }

    scrollAnimations.delete(target);
  };

  animation.frame = requestAnimationFrame(step);
  scrollAnimations.set(target, animation);
}

export function getVisualViewport(): { left: number; top: number; width: number; height: number } {
  const visual = window.visualViewport;
  if (visual) {
    return { left: visual.offsetLeft, top: visual.offsetTop, width: visual.width, height: visual.height };
  }

  return {
    left: 0,
    top: 0,
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
}

// Con "force" ricentriamo sempre (la pagina è l'unico scroller su quell'asse), altrimenti
// interveniamo solo quando la cella esce dalla fascia centrale.
export function needsPageScroll(start: number, size: number, viewportSize: number, force: boolean): boolean {
  if (force) {
    return true;
  }

  const margin = Math.min(viewportSize * 0.3, 160);
  return start < margin || start + size > viewportSize - margin;
}
