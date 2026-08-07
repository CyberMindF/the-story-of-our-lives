import {
  getInitialAccessMode,
  isAccessUnlocked,
  loadAuthSession,
  rememberAccessUnlock,
  revokeAuthSession,
  submitAuthRequest,
  clearAccessUnlock
} from "./auth.js";
import {
  rememberRequestedDestination,
  returnToRequestedDestination
} from "./navigation.js";
import { captureAnonymousVisit } from "./visits.js";

// Crea il controller riutilizzabile del Portone per login, registrazione e conferma della Chiave.
export function createAccessGate({ onUnlock, beforeLogout, onLogoutError } = {}) {
  const elements = getAccessElements();

  // Collega form, selettore della modalità e logout una sola volta.
  function bind() {
    elements.showLoginButton.addEventListener("click", () => setMode("login"));
    elements.showRegisterButton.addEventListener("click", () => setMode("register"));
    elements.logoutButton.addEventListener("click", logout);
    elements.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submit();
    });
  }

  // Registra la visita, verifica la sessione e decide quale passaggio di accesso mostrare.
  async function initialize() {
    rememberRequestedDestination();
    await captureAnonymousVisit();

    const session = await loadAuthSession();
    if (!session.authenticated) {
      setMode(getInitialAccessMode());
      return;
    }
    if (!isAccessUnlocked(session.user.id)) {
      setMode("key");
      return;
    }

    await completeAccess(session.user);
  }

  // Invia i dati richiesti dalla modalità corrente e completa l'accesso quando sono validi.
  async function submit() {
    const mode = elements.form.dataset.mode || "register";
    const payload = { worldKey: elements.key.value.trim() };

    if (mode !== "key") {
      payload.email = elements.email.value.trim();
      payload.password = elements.password.value;
    }

    setLoading(true);
    elements.error.textContent = "";

    try {
      const { response, result } = await submitAuthRequest(mode, payload);
      if (!response.ok) {
        if (response.status === 401 && mode === "key") {
          setMode("login");
        }
        throw new Error(result.error || "Accesso non riuscito.");
      }

      rememberAccessUnlock(result.user.id, mode !== "key");
      await completeAccess(result.user);
    } catch (error) {
      elements.error.textContent = error.message || "Impossibile completare l'accesso.";
    } finally {
      setLoading(false);
    }
  }

  // Mostra l'utente, apre l'interfaccia e richiama la pagina se non esiste un redirect pendente.
  async function completeAccess(user) {
    elements.greeting.textContent = `Ciao, ${user.nickname}`;
    document.body.classList.remove("access-locked");
    elements.gate.classList.add("hidden");
    elements.appShell.removeAttribute("inert");
    elements.appShell.removeAttribute("aria-hidden");

    if (!returnToRequestedDestination()) {
      await onUnlock?.(user);
    }
  }

  // Revoca la sessione dopo aver consentito alla pagina di registrare la propria chiusura.
  async function logout() {
    elements.logoutButton.disabled = true;

    try {
      await beforeLogout?.();
      const response = await revokeAuthSession();
      if (!response.ok) {
        throw new Error("Logout non riuscito.");
      }

      clearAccessUnlock();
      window.location.reload();
    } catch (error) {
      elements.logoutButton.disabled = false;
      onLogoutError?.(error);
    }
  }

  // Aggiorna campi e messaggi del form per la modalità richiesta.
  function setMode(mode) {
    const isKeyOnly = mode === "key";
    const isRegister = mode === "register";
    elements.form.dataset.mode = mode;
    elements.modeSwitcher.hidden = isKeyOnly;
    elements.accountFields.hidden = isKeyOnly;
    elements.email.required = !isKeyOnly;
    elements.password.required = !isKeyOnly;
    elements.showLoginButton.setAttribute("aria-pressed", String(mode === "login"));
    elements.showRegisterButton.setAttribute("aria-pressed", String(isRegister));
    elements.error.textContent = "";

    if (isKeyOnly) {
      elements.title.textContent = "Ti ricordi della chiave?";
      elements.text.textContent = "È la stessa con cui si apre anche il nostro mondo.";
    } else if (isRegister) {
      elements.title.textContent = "Entra per la prima volta";
      elements.text.textContent = "Crea il tuo accesso per custodire i progressi e ritrovare tutti i nostri ricordi.";
    } else {
      elements.title.textContent = "Rieccoci nel nostro mondo";
      elements.text.textContent = "Accedi con il tuo account per tornare alle parole che raccontano di noi.";
    }
    elements.submitButton.textContent = getSubmitLabel(mode);

    const target = isKeyOnly ? elements.key : elements.email;
    if (!window.matchMedia("(max-width: 640px)").matches) {
      target.focus();
    }
  }

  // Disabilita temporaneamente l'invio e mantiene coerente l'etichetta del pulsante.
  function setLoading(isLoading) {
    elements.submitButton.disabled = isLoading;
    elements.submitButton.textContent = isLoading
      ? "Attendi…"
      : getSubmitLabel(elements.form.dataset.mode);
  }

  return { bind, initialize, setMode };
}

// Recupera gli elementi obbligatori dell'interfaccia condivisa del Portone.
function getAccessElements() {
  return {
    appShell: document.getElementById("app-shell"),
    gate: document.getElementById("access-gate"),
    form: document.getElementById("access-form"),
    title: document.getElementById("access-title"),
    text: document.getElementById("access-text"),
    modeSwitcher: document.getElementById("access-mode-switcher"),
    accountFields: document.getElementById("access-account-fields"),
    email: document.getElementById("access-email"),
    password: document.getElementById("access-password"),
    key: document.getElementById("access-key"),
    submitButton: document.getElementById("access-submit-button"),
    showLoginButton: document.getElementById("show-login-button"),
    showRegisterButton: document.getElementById("show-register-button"),
    error: document.getElementById("access-error"),
    greeting: document.getElementById("user-greeting"),
    logoutButton: document.getElementById("logout-button")
  };
}

// Restituisce l'etichetta del pulsante coerente con la modalità corrente.
function getSubmitLabel(mode) {
  if (mode === "key") return "Entra";
  if (mode === "login") return "Accedi ed entra";
  return "Registrati ed entra";
}
