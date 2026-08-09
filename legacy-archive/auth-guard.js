import { isAccessUnlocked, loadAuthSession } from "./assets/js/shared/auth.js";
import { rememberCurrentDestination } from "./assets/js/shared/navigation.js";

const script = [...document.scripts].find((entry) => entry.src.includes("auth-guard.js"));
const gatewayUrl = new URL(script?.dataset.authGateway || "./", window.location.href);
const concealStyle = document.createElement("style");
concealStyle.textContent = "html:not([data-auth-ready='true']) { visibility: hidden; }";
document.head.append(concealStyle);

// Verifica sessione e Chiave della scheda, oppure torna al Portone conservando la pagina richiesta.
async function verifyPageAccess() {
  const session = await loadAuthSession();
  if (session.authenticated && isAccessUnlocked(session.user.id)) {
    document.documentElement.dataset.authReady = "true";
    concealStyle.remove();
    return session.user;
  }

  const returnTarget = rememberCurrentDestination();
  gatewayUrl.searchParams.set("returnTo", returnTarget);
  window.location.replace(gatewayUrl.href);
  return null;
}

// Le entry point delle pagine attendono questa Promise prima di inizializzare contenuti protetti.
window.mondoBiancoAuthReady = verifyPageAccess();
