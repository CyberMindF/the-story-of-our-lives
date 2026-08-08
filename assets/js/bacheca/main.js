const elements = {
  intro: document.querySelector("#bacheca-intro"),
  index: document.querySelector("#bacheca-index"),
  sections: document.querySelector("#bacheca-sections"),
  error: document.querySelector("#bacheca-error"),
  lightbox: document.querySelector("#bacheca-lightbox"),
  lightboxImage: document.querySelector("#lightbox-image"),
  lightboxCaption: document.querySelector("#lightbox-caption"),
  lightboxPrev: document.querySelector("#lightbox-prev"),
  lightboxNext: document.querySelector("#lightbox-next"),
  lightboxClose: document.querySelector("#lightbox-close")
};

let activeGallery = [];
let activeIndex = 0;

// Ogni media personale passa dall'endpoint autenticato, mai da un percorso statico pubblico.
function mediaUrl(key) {
  return `../api/media/${key}`;
}

function sectionId(period, day) {
  return day.slug === "generale" ? period.slug : `${period.slug}-${day.slug}`;
}

function renderIntro(paragraphs) {
  elements.intro.replaceChildren(
    ...paragraphs.map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    })
  );
}

function renderIndex(periods) {
  const links = periods.flatMap((period) =>
    period.days.map((day) => ({
      id: sectionId(period, day),
      label: day.title ? `${period.title} · ${day.title}` : period.title
    }))
  );
  elements.index.replaceChildren(
    ...links.map((link) => {
      const a = document.createElement("a");
      a.href = `#${link.id}`;
      a.textContent = link.label;
      return a;
    })
  );
}

// Foto consecutive diventano un'unica griglia; testo ed esterni interrompono la griglia
// senza perdere l'ordine originale di lettura.
function renderDayItems(items) {
  const fragment = document.createDocumentFragment();
  let photoBuffer = [];

  function flushPhotos() {
    if (photoBuffer.length === 0) return;
    const grid = document.createElement("div");
    grid.className = "bacheca-grid";
    const gallery = photoBuffer;
    gallery.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bacheca-thumb";
      const img = document.createElement("img");
      img.src = mediaUrl(photo.thumbKey || photo.key);
      img.alt = photo.caption || "Foto della Bacheca dei Ricordi";
      img.loading = "lazy";
      button.append(img);
      button.addEventListener("click", () => openLightbox(gallery, index));
      grid.append(button);
    });
    fragment.append(grid);
    photoBuffer = [];
  }

  for (const item of items) {
    if (item.type === "photo") {
      photoBuffer.push(item);
      continue;
    }
    flushPhotos();
    if (item.type === "text") {
      const p = document.createElement("p");
      p.className = "bacheca-text";
      p.textContent = item.text;
      fragment.append(p);
    } else if (item.type === "external" && item.href) {
      const a = document.createElement("a");
      a.className = "bacheca-external";
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Apri il contenuto esterno ↗";
      fragment.append(a);
    }
  }
  flushPhotos();
  return fragment;
}

function renderSections(periods) {
  const fragment = document.createDocumentFragment();
  for (const period of periods) {
    const periodSection = document.createElement("section");
    periodSection.className = "bacheca-period";
    const heading = document.createElement("h2");
    heading.textContent = period.title;
    periodSection.append(heading);

    for (const day of period.days) {
      const dayBlock = document.createElement("article");
      dayBlock.className = "bacheca-day";
      dayBlock.id = sectionId(period, day);
      dayBlock.tabIndex = -1;
      if (day.title) {
        const h3 = document.createElement("h3");
        h3.textContent = day.title;
        dayBlock.append(h3);
      }
      dayBlock.append(renderDayItems(day.items));
      periodSection.append(dayBlock);
    }
    fragment.append(periodSection);
  }
  elements.sections.replaceChildren(fragment);
}

function openLightbox(gallery, index) {
  activeGallery = gallery;
  activeIndex = index;
  showCurrentPhoto();
  elements.lightbox.showModal();
}

function showCurrentPhoto() {
  const photo = activeGallery[activeIndex];
  elements.lightboxImage.src = mediaUrl(photo.key);
  elements.lightboxImage.alt = photo.caption || "Foto della Bacheca dei Ricordi";
  elements.lightboxCaption.textContent = photo.caption || "";
  const hasMultiple = activeGallery.length > 1;
  elements.lightboxPrev.hidden = !hasMultiple;
  elements.lightboxNext.hidden = !hasMultiple;
}

function stepLightbox(delta) {
  if (activeGallery.length === 0) return;
  activeIndex = (activeIndex + delta + activeGallery.length) % activeGallery.length;
  showCurrentPhoto();
}

function bindLightbox() {
  elements.lightboxPrev.addEventListener("click", () => stepLightbox(-1));
  elements.lightboxNext.addEventListener("click", () => stepLightbox(1));
  elements.lightboxClose.addEventListener("click", () => elements.lightbox.close());
  elements.lightbox.addEventListener("click", (event) => {
    if (event.target === elements.lightbox) elements.lightbox.close();
  });
  elements.lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });

  let touchStartX = null;
  elements.lightbox.addEventListener("touchstart", (event) => { touchStartX = event.touches[0].clientX; }, { passive: true });
  elements.lightbox.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) stepLightbox(delta > 0 ? -1 : 1);
    touchStartX = null;
  }, { passive: true });
}

async function init() {
  bindLightbox();
  await window.mondoBiancoAuthReady;

  try {
    const response = await fetch("../content/bacheca.json");
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
    const data = await response.json();
    renderIntro(data.introduction);
    renderIndex(data.periods);
    renderSections(data.periods);

    const requestedSection = window.location.hash.slice(1);
    if (requestedSection) {
      requestAnimationFrame(() => document.getElementById(requestedSection)?.scrollIntoView());
    }
  } catch (error) {
    console.error("Errore nel caricamento della Bacheca:", error);
    elements.error.hidden = false;
  }
}

void init();
