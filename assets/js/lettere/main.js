const elements = {
  form: document.querySelector("#letter-form"),
  submit: document.querySelector("#letter-submit"),
  status: document.querySelector("#letter-status"),
  list: document.querySelector("#letters-list"),
  empty: document.querySelector("#letters-empty"),
  error: document.querySelector("#letters-error"),
  dialog: document.querySelector("#letter-dialog"),
  dialogPaper: document.querySelector(".letter-paper"),
  dialogClose: document.querySelector("#letter-dialog-close"),
  dialogDate: document.querySelector("#letter-dialog-date"),
  dialogBody: document.querySelector("#letter-dialog-body"),
  dialogSignature: document.querySelector("#letter-dialog-signature")
};

const dateFormatter = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

let activeCardEl = null;

function formatDate(isoDate) {
  return dateFormatter.format(new Date(isoDate));
}

function letterRotation(id) {
  const seed = Math.sin(id * 999.17) * 10000;
  const fraction = seed - Math.floor(seed);
  return (fraction * 2 - 1) * 2.4;
}

// Un biglietto corto resta piccolo, una lettera lunga diventa un vero foglio: la "taglia"
// segue la lunghezza del testo invece di schiacciare tutto nella stessa cartolina.
function letterSizeCategory(bodyLength) {
  if (bodyLength < 240) return "bigliettino";
  if (bodyLength > 900) return "foglio-a4";
  return "media";
}

function flipTransform(fromRect, toRect) {
  const scaleX = fromRect.width / toRect.width;
  const scaleY = fromRect.height / toRect.height;
  const translateX = (fromRect.left + fromRect.width / 2) - (toRect.left + toRect.width / 2);
  const translateY = (fromRect.top + fromRect.height / 2) - (toRect.top + toRect.height / 2);
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY}) rotate(0deg)`;
}

function renderLetters(letters) {
  elements.list.replaceChildren();
  elements.empty.hidden = letters.length > 0;

  letters.forEach((letter) => {
    const isUnread = !letter.isMine && !letter.readAt;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-card";
    if (isUnread) button.classList.add("is-unread");
    button.innerHTML = `
      <span class="envelope" aria-hidden="true">
        <span class="envelope-back"></span>
        <span class="envelope-flap envelope-flap-behind"></span>
        <span class="envelope-paper"></span>
        <span class="envelope-flap envelope-flap-front"></span>
        <span class="envelope-seal"></span>
      </span>
      <span class="letter-card-label">
        <span class="letter-card-author"></span>
        <span class="letter-card-date"></span>
      </span>
      <span class="letter-card-status">${isUnread ? "Da leggere" : ""}</span>
    `;
    button.querySelector(".letter-card-author").textContent = letter.isMine ? "Tu" : letter.author;
    button.querySelector(".letter-card-date").textContent = formatDate(letter.createdAt);
    button.addEventListener("click", () => openLetter(letter, button));
    elements.list.append(button);
  });
}

async function openLetter(letter, cardElement) {
  activeCardEl = cardElement;
  const envelopeEl = cardElement.querySelector(".envelope");
  const fromRect = envelopeEl.getBoundingClientRect();

  elements.dialogDate.textContent = formatDate(letter.createdAt);
  elements.dialogBody.textContent = letter.body;
  elements.dialogSignature.textContent = `~ ${letter.author}`;
  elements.dialogPaper.style.setProperty("--letter-rotation", `${letterRotation(letter.id)}deg`);
  elements.dialog.dataset.letterSize = letterSizeCategory(letter.body.length);

  elements.dialog.showModal();

  const toRect = elements.dialogPaper.getBoundingClientRect();
  elements.dialogPaper.style.transition = "none";
  elements.dialogPaper.style.opacity = "0.5";
  elements.dialogPaper.style.transform = flipTransform(fromRect, toRect);
  elements.dialogPaper.getBoundingClientRect(); // forza il reflow prima di rimuovere lo stato iniziale

  requestAnimationFrame(() => {
    elements.dialogPaper.style.transition = "";
    elements.dialogPaper.style.transform = "";
    elements.dialogPaper.style.opacity = "";
  });

  if (!letter.isMine && !letter.readAt) {
    try {
      const response = await fetch(`../api/letters/${letter.id}`, { method: "POST", credentials: "same-origin" });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.readAt) {
        letter.readAt = result.readAt;
        cardElement.classList.remove("is-unread");
        const statusEl = cardElement.querySelector(".letter-card-status");
        if (statusEl) statusEl.textContent = "";
      }
    } catch (error) {
      console.error("Errore nel segnare la lettera come letta:", error);
    }
  }
}

function closeLetterAnimated() {
  const envelopeEl = activeCardEl?.querySelector(".envelope");
  if (!envelopeEl || !elements.dialog.open) {
    elements.dialog.close();
    return;
  }

  const toRect = envelopeEl.getBoundingClientRect();
  const fromRect = elements.dialogPaper.getBoundingClientRect();
  elements.dialogPaper.style.transition = "transform .35s ease, opacity .3s ease";
  elements.dialogPaper.style.opacity = "0.4";
  elements.dialogPaper.style.transform = flipTransform(toRect, fromRect);

  const onEnd = () => {
    elements.dialogPaper.removeEventListener("transitionend", onEnd);
    elements.dialog.close();
    elements.dialogPaper.style.transition = "";
    elements.dialogPaper.style.transform = "";
    elements.dialogPaper.style.opacity = "";
  };
  elements.dialogPaper.addEventListener("transitionend", onEnd);
}

async function loadLetters() {
  try {
    const response = await fetch("../api/letters", { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
    const data = await response.json();
    renderLetters(data.letters || []);
  } catch (error) {
    console.error("Errore nel caricamento delle lettere:", error);
    elements.error.hidden = false;
  }
}

async function submitLetter(event) {
  event.preventDefault();
  elements.submit.disabled = true;
  elements.status.className = "letter-status";
  elements.status.textContent = "Sto inviando la lettera...";

  try {
    const response = await fetch("../api/letters", {
      method: "POST",
      credentials: "same-origin",
      body: new FormData(elements.form)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Invio non riuscito.");

    elements.form.reset();
    elements.status.classList.add("is-success");
    elements.status.textContent = "Lettera inviata.";
    await loadLetters();
  } catch (error) {
    elements.status.classList.add("is-error");
    elements.status.textContent = error.message;
  } finally {
    elements.submit.disabled = false;
  }
}

async function init() {
  await window.mondoBiancoAuthReady;
  elements.form.addEventListener("submit", submitLetter);
  elements.dialogClose.addEventListener("click", closeLetterAnimated);
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) closeLetterAnimated();
  });
  elements.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLetterAnimated();
  });
  await loadLetters();
}

void init();
