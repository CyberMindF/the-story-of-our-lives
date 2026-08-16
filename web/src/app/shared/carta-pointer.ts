export const CARTA_MAX_ANGLE = 16;
export const CARTA_REST_LIGHT: readonly [number, number] = [0.35, 0.28];
export const CARTA_ENTER_DURATION_MS = 140;

const enterTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export function beginCartaPointerTracking(element: HTMLElement): void {
  if (element.classList.contains('is-active') || element.classList.contains('is-entering')) return;
  element.classList.add('is-entering');
  const timer = setTimeout(() => {
    element.classList.remove('is-entering');
    element.classList.add('is-active');
    enterTimers.delete(element);
  }, CARTA_ENTER_DURATION_MS);
  enterTimers.set(element, timer);
}

export function endCartaPointerTracking(element: HTMLElement): void {
  const timer = enterTimers.get(element);
  if (timer) clearTimeout(timer);
  enterTimers.delete(element);
  element.classList.remove('is-entering', 'is-active');
}

export function cartaPointerPosition(event: PointerEvent, host: HTMLElement): readonly [number, number] {
  const rect = host.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  return [x, y];
}

export function applyCartaPointer(frame: HTMLElement, x: number, y: number): void {
  beginCartaPointerTracking(frame);
  frame.style.setProperty('--rx', `${-(y - 0.5) * CARTA_MAX_ANGLE * 2}deg`);
  frame.style.setProperty('--ry', `${(x - 0.5) * CARTA_MAX_ANGLE * 2}deg`);
  frame.style.setProperty('--mx', `${x * 100}%`);
  frame.style.setProperty('--my', `${y * 100}%`);
}

export function resetCartaPointer(frame: HTMLElement): void {
  frame.style.setProperty('--rx', '0deg');
  frame.style.setProperty('--ry', '0deg');
  frame.style.setProperty('--mx', `${CARTA_REST_LIGHT[0] * 100}%`);
  frame.style.setProperty('--my', `${CARTA_REST_LIGHT[1] * 100}%`);
  endCartaPointerTracking(frame);
}
