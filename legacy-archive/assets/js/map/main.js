const elements = {
  introduction: document.querySelector("#map-introduction"),
  pins: document.querySelector("#map-pins"),
  preview: document.querySelector("#map-preview"),
  previewImage: document.querySelector("#map-preview-image"),
  previewNumber: document.querySelector("#map-preview-number"),
  previewLabel: document.querySelector("#map-preview-label"),
  previewTitle: document.querySelector("#map-preview-title"),
  previewText: document.querySelector("#map-preview-text"),
  previewLink: document.querySelector("#map-preview-link"),
  destinationList: document.querySelector("#destination-list"),
  error: document.querySelector("#map-error")
};

let destinations = [];

// Proietta coordinate reali sulla stessa Equal Earth usata dall'immagine cartografica.
function projectCoordinates(coordinates) {
  if (!coordinates) return { x: 89, y: 87 };

  const radians = Math.PI / 180;
  const latitude = coordinates.latitude * radians;
  const longitude = (coordinates.longitude - 11) * radians;
  const a1 = 1.340264;
  const a2 = -0.081106;
  const a3 = 0.000893;
  const a4 = 0.003796;
  const m = Math.sqrt(3) / 2;
  const theta = Math.asin(m * Math.sin(latitude));
  const theta2 = theta * theta;
  const theta6 = theta2 * theta2 * theta2;
  const denominator = m * (a1 + 3 * a2 * theta2 + theta6 * (7 * a3 + 9 * a4 * theta2));
  const projectedX = longitude * Math.cos(theta) / denominator;
  const projectedY = theta * (a1 + a2 * theta2 + theta6 * (a3 + a4 * theta2));
  const x = 50 + (projectedX / 2.70663) * 50;
  const y = 50 - (projectedY / 1.31736) * 50;

  return { x, y };
}

// Converte le coordinate geografiche in variabili usate dalla puntina visuale.
function createPin(destination, index) {
  const position = projectCoordinates(destination.coordinates);
  const button = document.createElement("button");
  button.className = `map-pin${destination.isOpen ? " is-open" : ""}`;
  button.type = "button";
  button.style.setProperty("--pin-x", `${position.x}%`);
  button.style.setProperty("--pin-y", `${position.y}%`);
  button.dataset.destinationId = destination.id;
  button.setAttribute("aria-label", `Mostra ${destination.name}`);
  button.innerHTML = `<span class="pin-dot"></span><span class="pin-label"><small>${String(index + 1).padStart(2, "0")}</small><strong></strong></span>`;
  button.querySelector("strong").textContent = destination.name;
  button.addEventListener("click", () => selectDestination(destination.id));
  return button;
}

// Aggiorna anteprima e stato delle puntine senza duplicare il testo completo.
function selectDestination(destinationId) {
  const destination = destinations.find((item) => item.id === destinationId);
  if (!destination) return;

  const index = destinations.indexOf(destination);
  elements.pins.querySelectorAll(".map-pin").forEach((pin) => {
    pin.setAttribute("aria-pressed", String(pin.dataset.destinationId === destinationId));
  });

  elements.previewNumber.textContent = String(index + 1).padStart(2, "0");
  elements.previewLabel.textContent = destination.isOpen ? "La puntina ancora libera" : "Una meta sulla mappa";
  elements.previewTitle.textContent = destination.name;
  elements.previewText.textContent = destination.paragraphs[0];
  elements.previewLink.href = `#destination-${destination.id}`;

  const cover = destination.images[0];
  elements.preview.classList.toggle("has-no-image", !cover);
  if (cover) {
    elements.previewImage.src = cover.src;
    elements.previewImage.alt = cover.alt;
  } else {
    elements.previewImage.removeAttribute("src");
    elements.previewImage.alt = "";
  }
}

// Crea una galleria per le sole immagini associate a uno specifico passaggio.
function createGallery(images) {
  const gallery = document.createElement("div");
  gallery.className = `destination-gallery images-${images.length}`;

  images.forEach((imageData) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = imageData.src;
    image.alt = imageData.alt;
    image.loading = "lazy";
    figure.append(image);
    gallery.append(figure);
  });

  return gallery;
}

// Ricompone immagini e paragrafi nella stessa successione dell'export originale.
function createNarrative(destination) {
  const narrative = document.createElement("div");
  narrative.className = "destination-narrative";

  destination.paragraphs.forEach((text, paragraphIndex) => {
    const passage = document.createElement("section");
    const images = destination.images.filter((image) => image.beforeParagraph === paragraphIndex);
    // I racconti eccezionalmente lunghi usano una composizione verticale per non superare la fotografia.
    passage.className = `destination-passage${images.length && text.length > 900 ? " is-long" : ""}`;
    if (images.length) passage.append(createGallery(images));

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    passage.append(paragraph);
    narrative.append(passage);
  });

  return narrative;
}

// Costruisce la versione completa e accessibile di una destinazione.
function createDestination(destination, index) {
  const article = document.createElement("article");
  article.id = `destination-${destination.id}`;
  article.className = `destination-entry${destination.isOpen ? " is-open" : ""}${destination.images.length ? "" : " has-no-images"}`;

  const heading = document.createElement("header");
  heading.className = "destination-heading";
  heading.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><h3></h3>`;
  heading.querySelector("h3").textContent = destination.name;

  article.append(heading);
  article.append(createNarrative(destination));
  return article;
}

// Carica dati, puntine e diario usando esclusivamente l'ordine dell'array JSON.
async function loadMap() {
  try {
    const response = await fetch("../content/map.json");
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.introduction) || !Array.isArray(data.destinations) || data.destinations.length !== 6) {
      throw new Error("La mappa deve contenere introduzione e sei destinazioni");
    }

    destinations = data.destinations;
    data.introduction.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      elements.introduction.append(paragraph);
    });

    destinations.forEach((destination, index) => {
      elements.pins.append(createPin(destination, index));
      elements.destinationList.append(createDestination(destination, index));
    });

    selectDestination(destinations[0].id);
  } catch (error) {
    console.error("Errore nel caricamento della mappa:", error);
    elements.error.hidden = false;
  }
}

loadMap();
