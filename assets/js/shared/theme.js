const DEFAULT_THEME_ID = "the-white-world";
const THEMES = [
  { id: "the-white-world", label: "Notte", swatch: "#17243a" },
  { id: "sea", label: "Ocean", swatch: "#467d77" },
  { id: "velvet", label: "Velvet", swatch: "#5d4452" },
  { id: "red-of-you", label: "Red of You", swatch: "#bf3553" },
  { id: "green-of-me", label: "Green of Me", swatch: "#486a53" }
];

// Crea un controller indipendente per tema, pulsanti e messaggi temporanei.
export function createThemeController({ storageKey, switcher, toast, onThemeChanged }) {
  let toastTimer = null;

  // Applica il tema salvato senza riscrivere localStorage durante il caricamento.
  function applySavedTheme() {
    const savedTheme = localStorage.getItem(storageKey) || DEFAULT_THEME_ID;
    applyTheme(savedTheme, { persist: false });
  }

  // Genera un pallino per tema (colore rappresentativo, nessuna etichetta visibile) —
  // pensato per stare nella barra utente di ogni pagina, non in un pannello a parte.
  function renderSwitcher() {
    if (!switcher) return;
    switcher.innerHTML = "";

    THEMES.forEach((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-chip";
      button.dataset.theme = theme.id;
      button.style.setProperty("--chip-color", theme.swatch);
      button.setAttribute("aria-label", `Attiva il tema ${theme.label}`);
      button.title = theme.label;
      button.addEventListener("click", () => {
        const previousTheme = document.body.dataset.theme;
        applyTheme(theme.id);
        showToast(`Tema ${theme.label}`);
        if (previousTheme !== theme.id) {
          onThemeChanged?.(previousTheme, theme.id);
        }
      });
      switcher.appendChild(button);
    });

    updateButtons();
  }

  // Applica un tema noto, usando il tema di default come fallback e persistendo la scelta quando richiesto.
  function applyTheme(themeId, options = {}) {
    const theme = THEMES.find((entry) => entry.id === themeId)
      || THEMES.find((entry) => entry.id === DEFAULT_THEME_ID)
      || THEMES[0];
    document.body.dataset.theme = theme.id;

    if (options.persist !== false) {
      localStorage.setItem(storageKey, theme.id);
    }

    updateButtons();
  }

  // Mantiene stato visuale e attributo ARIA coerenti con il tema attivo.
  function updateButtons() {
    const activeTheme = document.body.dataset.theme;
    switcher?.querySelectorAll(".theme-chip").forEach((button) => {
      const selected = button.dataset.theme === activeTheme;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  // Mostra su mobile un messaggio breve e sostituisce quello eventualmente ancora visibile.
  function showToast(message) {
    if (!toast || !window.matchMedia("(max-width: 640px)").matches) {
      return;
    }

    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.remove("is-visible");
    void toast.offsetWidth;
    toast.classList.add("is-visible");

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  return { applySavedTheme, renderSwitcher, showToast };
}
