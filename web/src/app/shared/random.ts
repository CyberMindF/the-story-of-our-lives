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

// Rotazione pseudo-casuale ma deterministica (stesso id → sempre la stessa inclinazione, non
// cambia a ogni render/reload): usata per far sembrare i fogli di carta appoggiati lì per
// davvero (Lettere, Il Barattolo dei Pensieri), non tutti perfettamente dritti né instabili.
export function seededRotation(seed: number, maxDegrees = 2.4): number {
  const value = Math.sin(seed * 999.17) * 10000;
  const fraction = value - Math.floor(value);
  return (fraction * 2 - 1) * maxDegrees;
}
