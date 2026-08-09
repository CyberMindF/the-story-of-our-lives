const STAR_COUNT = 150;

// Crea un cielo casuale senza pattern ripetuti, mantenendolo separato dai contenuti interattivi.
export function createWorldStars() {
  if (!document.body.classList.contains("world-atmosphere") || document.querySelector(".world-stars")) {
    return;
  }

  const layer = document.createElement("div");
  layer.className = "world-stars";
  layer.setAttribute("aria-hidden", "true");
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < STAR_COUNT; index += 1) {
    fragment.append(createStar());
  }

  layer.append(fragment);
  document.body.prepend(layer);
}

// Genera posizione, dimensione e luminosità indipendenti per una singola stella.
function createStar() {
  const star = document.createElement("span");
  const size = randomBetween(0.6, 2.1);
  star.className = "world-star";
  star.style.setProperty("--star-x", `${randomBetween(0, 100).toFixed(3)}%`);
  star.style.setProperty("--star-y", `${randomBetween(0, 100).toFixed(3)}%`);
  star.style.setProperty("--star-size", `${size.toFixed(2)}px`);
  star.style.setProperty("--star-opacity", randomBetween(0.2, 0.82).toFixed(2));
  star.classList.toggle("is-bright", size > 1.65 && randomBetween(0, 1) > 0.45);
  return star;
}

// Usa casualità crittografica quando disponibile, con fallback per browser meno recenti.
function randomBetween(minimum, maximum) {
  let value = Math.random();
  if (globalThis.crypto?.getRandomValues) {
    const randomValue = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomValue);
    value = randomValue[0] / 4294967295;
  }
  return minimum + value * (maximum - minimum);
}
