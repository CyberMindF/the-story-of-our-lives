const DEFAULT_THEME_ID = "sea";
const THEMES = [
  { id: "sea", label: "Ocean", icon: "sun" },
  { id: "velvet", label: "Velvet", icon: "moon" },
  { id: "red-of-you", label: "Red of You", icon: "letter", iconText: "D" },
  { id: "green-of-me", label: "Green of Me", icon: "letter", iconText: "R" }
];

// Crea un controller indipendente per tema, pulsanti e messaggi temporanei.
export function createThemeController({ storageKey, switcher, toast, onThemeChanged }) {
  let toastTimer = null;

  // Applica il tema salvato senza riscrivere localStorage durante il caricamento.
  function applySavedTheme() {
    const savedTheme = localStorage.getItem(storageKey) || DEFAULT_THEME_ID;
    applyTheme(savedTheme, { persist: false });
  }

  // Genera i pulsanti dei temi e registra un evento soltanto quando il valore cambia davvero.
  function renderSwitcher() {
    switcher.innerHTML = "";

    THEMES.forEach((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-chip";
      button.dataset.theme = theme.id;
      button.innerHTML = `${getThemeIconMarkup(theme)}<span class="theme-chip-name">${theme.label}</span>`;
      button.setAttribute("aria-label", `Attiva il tema ${theme.label}`);
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

  // Applica un tema noto, usando Ocean come fallback e persistendo la scelta quando richiesto.
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

// Restituisce il markup dell'icona previsto per ciascun tipo di tema.
function getThemeIconMarkup(theme) {
  if (theme.icon === "letter") {
    return `<span class="theme-chip-icon theme-chip-icon-letter" aria-hidden="true">${theme.iconText ?? ""}</span>`;
  }
  if (theme.icon === "moon") {
    return '<svg class="theme-chip-icon theme-chip-icon-moon" viewBox="0 0 24 24" aria-hidden="true"><circle class="moon-disc" cx="12" cy="12" r="9" /><path class="moon-crescent" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>';
  }
  return `<span class="theme-chip-icon theme-chip-icon-${theme.icon}" aria-hidden="true"></span>`;
}
