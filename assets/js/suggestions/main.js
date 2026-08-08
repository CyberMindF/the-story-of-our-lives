const form = document.querySelector("#suggestion-form");
const submitButton = document.querySelector("#suggestion-submit");
const status = document.querySelector("#suggestion-status");

// Invia il suggerimento autenticato e lascia il form intatto in caso di errore.
async function submitSuggestion(event) {
  event.preventDefault();
  submitButton.disabled = true;
  status.className = "suggestion-status";
  status.textContent = "Sto conservando il tuo suggerimento...";

  try {
    const response = await fetch("../api/suggestions", {
      method: "POST",
      credentials: "same-origin",
      body: new FormData(form)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.error || "Invio non riuscito.");

    form.reset();
    status.classList.add("is-success");
    status.textContent = `Suggerimento ricevuto. Grazie, ${result.author}.`;
  } catch (error) {
    status.classList.add("is-error");
    status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}

async function init() {
  await window.mondoBiancoAuthReady;
  form.addEventListener("submit", submitSuggestion);
}

void init();
