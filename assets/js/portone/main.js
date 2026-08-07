import { createAccessGate } from "../shared/access-gate.js";
import { createWorldStars } from "../shared/world-atmosphere.js";
import { createThemeController } from "../shared/theme.js";

const themeController = createThemeController({
  storageKey: "noi-crossword-theme-v15",
  switcher: null,
  toast: null
});

// Inizializza il Portone e porta all'hub quando non esiste una destinazione interna salvata.
async function init() {
  themeController.applySavedTheme();
  createWorldStars();
  const accessGate = createAccessGate({
    onUnlock() {
      window.location.replace("./mondo-bianco/");
    }
  });
  accessGate.bind();
  await accessGate.initialize();
}

void init();
