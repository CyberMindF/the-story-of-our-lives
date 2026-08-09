const ADVENTURE = "il-prezzo-della-verita";

const elements = {
  form: document.querySelector("#maga-form"),
  submit: document.querySelector("#maga-submit"),
  status: document.querySelector("#maga-status"),
  totalHint: document.querySelector("#stat-total-hint"),
  name: document.querySelector("#char-name"),
  catName: document.querySelector("#char-cat-name"),
  description: document.querySelector("#char-description"),
  statMente: document.querySelector("#stat-mente"),
  statCuore: document.querySelector("#stat-cuore"),
  statCorpo: document.querySelector("#stat-corpo"),
  statMagia: document.querySelector("#stat-magia"),
  stress: document.querySelector("#stress-current"),
  spellSlots: document.querySelector("#spell-slots-current"),
  inventory: document.querySelector("#char-inventory")
};

const statInputs = [elements.statMente, elements.statCuore, elements.statCorpo, elements.statMagia];

function updateStatTotal() {
  const total = statInputs.reduce((sum, input) => sum + (Number.parseInt(input.value, 10) || 0), 0);
  elements.totalHint.textContent = `Totale: ${total} / 12`;
  elements.totalHint.classList.toggle("is-off", total !== 12);
}

function setFieldsDisabled(disabled) {
  for (const el of elements.form.elements) {
    el.disabled = disabled;
  }
}

async function loadCharacter() {
  await window.mondoBiancoAuthReady;
  setFieldsDisabled(true);
  elements.status.textContent = "Sto caricando la scheda...";

  try {
    const response = await fetch(`../../../../api/gdr/character?adventure=${ADVENTURE}`, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`Caricamento fallito: ${response.status}`);
    const data = await response.json();
    const character = data.character;

    elements.name.value = character.name;
    elements.catName.value = character.catName;
    elements.description.value = character.description;
    elements.statMente.value = character.statMente;
    elements.statCuore.value = character.statCuore;
    elements.statCorpo.value = character.statCorpo;
    elements.statMagia.value = character.statMagia;
    elements.stress.value = character.stressCurrent;
    elements.spellSlots.value = character.spellSlotsCurrent;
    elements.inventory.value = character.inventory;

    updateStatTotal();
    elements.status.textContent = "";
  } catch (error) {
    console.error("Errore nel caricamento della scheda:", error);
    elements.status.textContent = "Non è stato possibile caricare la scheda salvata.";
  } finally {
    setFieldsDisabled(false);
  }
}

async function saveCharacter(event) {
  event.preventDefault();
  elements.submit.disabled = true;
  elements.status.textContent = "Sto salvando...";

  try {
    const form = new FormData(elements.form);
    form.set("adventure", ADVENTURE);
    const response = await fetch("../../../../api/gdr/character", { method: "POST", credentials: "same-origin", body: form });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Salvataggio non riuscito.");
    elements.status.textContent = "Scheda salvata.";
  } catch (error) {
    elements.status.textContent = error.message;
  } finally {
    elements.submit.disabled = false;
  }
}

statInputs.forEach((input) => input.addEventListener("input", updateStatTotal));
elements.form.addEventListener("submit", saveCharacter);

void loadCharacter();
