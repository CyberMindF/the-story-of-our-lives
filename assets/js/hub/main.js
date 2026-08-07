import { clearAccessUnlock, revokeAuthSession } from "../shared/auth.js";
import { clearRequestedDestination } from "../shared/navigation.js";
import { createThemeController } from "../shared/theme.js";
import { createWorldStars } from "../shared/world-atmosphere.js";

const elements = {
  greeting: document.getElementById("user-greeting"),
  logoutButton: document.getElementById("logout-button")
};

const themeController = createThemeController({
  storageKey: "noi-crossword-theme-v15",
  switcher: null,
  toast: null
});

// Mostra l'hub soltanto dopo la verifica condivisa di sessione e Chiave.
async function init() {
  themeController.applySavedTheme();
  createWorldStars();
  const user = await window.mondoBiancoAuthReady;
  if (!user) {
    return;
  }

  elements.greeting.textContent = `Ciao, ${user.nickname}`;
  elements.logoutButton.addEventListener("click", logout);
}

// Revoca la sessione e riporta al Portone.
async function logout() {
  elements.logoutButton.disabled = true;
  const response = await revokeAuthSession();
  if (response.ok) {
    clearAccessUnlock();
    clearRequestedDestination();
    window.location.replace("../");
    return;
  }
  elements.logoutButton.disabled = false;
}

void init();
