const introduction = document.querySelector("#stories-introduction");
const list = document.querySelector("#stories-list");
const errorMessage = document.querySelector("#stories-error");
const suggestionForm = document.querySelector("#story-suggestion-form");
const suggestionSubmit = document.querySelector("#suggestion-submit");
const suggestionStatus = document.querySelector("#suggestion-status");

// Converte la data tecnica del JSON nel formato usato nella pagina originale.
function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

// Apre una storia richiesta tramite URL e porta il lettore al suo inizio.
function openStory(storyId) {
  const story = document.querySelector(`#story-${storyId}`);
  if (!story) return;

  story.open = true;
  story.scrollIntoView({ behavior: "smooth", block: "start" });
  story.querySelector("summary")?.focus({ preventScroll: true });
}

// Divide il testo soltanto sugli a capo già presenti nell'export Notion.
function renderStoryBody(container, body) {
  body.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    container.append(paragraph);
  });
}

// Costruisce una storia espandibile con gli eventuali media associati.
function renderStory(story, position) {
  const details = document.createElement("details");
  details.id = `story-${story.id}`;
  details.className = "story-entry";

  const summary = document.createElement("summary");
  summary.innerHTML = `<span class="story-number">${String(position + 1).padStart(2, "0")}</span><span class="story-heading"><strong></strong><time datetime="${story.date}">${formatDate(story.date)}</time></span><span class="story-toggle" aria-hidden="true">+</span>`;
  summary.querySelector("strong").textContent = story.title;

  const content = document.createElement("div");
  content.className = "story-content";

  if (story.videoUrl) {
    const player = document.createElement("iframe");
    player.className = "story-player";
    player.title = `Accompagnamento per ${story.title}`;
    player.src = story.videoUrl;
    player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    player.referrerPolicy = "strict-origin-when-cross-origin";
    player.allowFullscreen = true;
    content.append(player);
  }

  const prose = document.createElement("div");
  prose.className = "story-prose";
  renderStoryBody(prose, story.body);
  content.append(prose);

  if (story.image) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = story.image;
    image.alt = story.imageAlt;
    image.loading = "lazy";
    figure.append(image);
    content.append(figure);
  }

  details.append(summary, content);
  return details;
}

// Carica la raccolta mantenendo l'ordine dichiarato nel JSON.
async function loadStories() {
  try {
    const response = await fetch("../content/stories.json");
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.stories) || data.stories.length !== 4) {
      throw new Error("La raccolta deve contenere quattro storie");
    }

    introduction.textContent = data.introduction;
    data.stories.forEach((story, position) => {
      list.append(renderStory(story, position));
    });

    const requestedStory = window.location.hash.replace("#story-", "");
    if (requestedStory) requestAnimationFrame(() => openStory(requestedStory));
  } catch (error) {
    console.error("Errore nel caricamento delle storie:", error);
    errorMessage.hidden = false;
  }
}

// Invia la proposta testuale autenticata e lascia il form intatto in caso di errore.
async function submitSuggestion(event) {
  event.preventDefault();
  suggestionSubmit.disabled = true;
  suggestionStatus.className = "suggestion-status suggestion-field-wide";
  suggestionStatus.textContent = "Sto conservando la tua storia...";

  try {
    const response = await fetch("../api/stories/suggestions", {
      method: "POST",
      credentials: "same-origin",
      body: new FormData(suggestionForm)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.error || "Invio non riuscito.");

    suggestionForm.reset();
    suggestionStatus.classList.add("is-success");
    suggestionStatus.textContent = `La storia è stata conservata. Grazie, ${result.author}.`;
  } catch (error) {
    suggestionStatus.classList.add("is-error");
    suggestionStatus.textContent = error.message;
  } finally {
    suggestionSubmit.disabled = false;
  }
}

suggestionForm.addEventListener("submit", submitSuggestion);
loadStories();
