// Usa casualità crittografica quando disponibile, con fallback per browser meno recenti.
// Condiviso da world-stars e world-lanterns (stesso identico bisogno: N elementi decorativi
// distribuiti/temporizzati a caso al primo render).
export function randomBetween(minimum: number, maximum: number): number {
  let value = Math.random();
  if (globalThis.crypto?.getRandomValues) {
    const randomValue = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomValue);
    value = randomValue[0] / 4294967295;
  }
  return minimum + value * (maximum - minimum);
}
