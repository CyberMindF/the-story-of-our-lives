const ADVENTURE = "il-prezzo-della-verita";

const elements = {
  thread: document.querySelector("#turn-thread"),
  empty: document.querySelector("#turn-empty"),
  error: document.querySelector("#turn-error"),
  form: document.querySelector("#turn-form"),
  body: document.querySelector("#turn-body"),
  submit: document.querySelector("#turn-submit"),
  status: document.querySelector("#turn-status")
};

const dateFormatter = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

function formatDate(isoDate) {
  return dateFormatter.format(new Date(isoDate));
}

function renderTurns(turns) {
  elements.thread.replaceChildren();
  elements.empty.hidden = turns.length > 0;

  turns.forEach((turn) => {
    const entry = document.createElement("article");
    entry.className = "gdr-turn";
    if (turn.isMine) entry.classList.add("is-mine");
    entry.innerHTML = `
      <div class="gdr-turn-meta">
        <span class="gdr-turn-author"></span>
        <span class="gdr-turn-date"></span>
      </div>
      <p class="gdr-turn-body"></p>
    `;
    entry.querySelector(".gdr-turn-author").textContent = turn.isMine ? "Tu" : turn.author;
    entry.querySelector(".gdr-turn-date").textContent = formatDate(turn.createdAt);
    entry.querySelector(".gdr-turn-body").textContent = turn.body;
    elements.thread.append(entry);
  });
}

async function loadTurns() {
  try {
    const response = await fetch(`../../../../api/gdr/turns?adventure=${ADVENTURE}`, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
    const data = await response.json();
    elements.error.hidden = true;
    renderTurns(data.turns || []);
  } catch (error) {
    console.error("Errore nel caricamento del turno:", error);
    elements.error.hidden = false;
  }
}

async function submitTurn(event) {
  event.preventDefault();
  elements.submit.disabled = true;
  elements.status.textContent = "Sto inviando...";

  try {
    const form = new FormData(elements.form);
    form.set("adventure", ADVENTURE);
    const response = await fetch("../../../../api/gdr/turns", { method: "POST", credentials: "same-origin", body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Invio non riuscito.");

    elements.form.reset();
    elements.status.textContent = "";
    await loadTurns();
  } catch (error) {
    elements.status.textContent = error.message;
  } finally {
    elements.submit.disabled = false;
  }
}

async function init() {
  await window.mondoBiancoAuthReady;
  elements.form.addEventListener("submit", submitTurn);
  await loadTurns();
}

void init();
