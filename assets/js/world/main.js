import { clearAccessUnlock, revokeAuthSession } from "../shared/auth.js";
import { clearRequestedDestination } from "../shared/navigation.js";
import { createThemeController } from "../shared/theme.js";
import { createWorldStars } from "../shared/world-atmosphere.js";
import { sectionFromPath, trackEvent } from "../shared/telemetry.js";

const elements = {
  greeting: document.getElementById("user-greeting"),
  logoutButton: document.getElementById("logout-button"),
  themeSwitcher: document.getElementById("theme-switcher")
};

const themeController = createThemeController({
  storageKey: "noi-crossword-theme-v15",
  switcher: elements.themeSwitcher,
  toast: null
});

// Inizializza gli elementi comuni soltanto dopo la verifica dell'accesso alla pagina.
async function init() {
  themeController.applySavedTheme();
  themeController.renderSwitcher();
  createWorldStars();
  const user = await window.mondoBiancoAuthReady;
  if (!user) return;

  elements.greeting.textContent = `Ciao, ${user.nickname}`;
  elements.logoutButton.addEventListener("click", logout);

  void trackEvent(sectionFromPath(), "world_page_opened", { path: window.location.pathname });
}

// Revoca la sessione e torna al Portone senza conservare la pagina interna corrente.
async function logout() {
  elements.logoutButton.disabled = true;
  const response = await revokeAuthSession();
  if (response.ok) {
    clearAccessUnlock();
    clearRequestedDestination();
    window.location.replace(document.body.dataset.logoutUrl || "../");
    return;
  }
  elements.logoutButton.disabled = false;
}

void init();
