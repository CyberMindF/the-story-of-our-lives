(function protectMondoBiancoPage() {
  "use strict";

  const ACCESS_SESSION_KEY = "noi-crossword-access-session-v1";
  const RETURN_TARGET_KEY = "mondo-bianco-return-target-v1";
  const script = document.currentScript;
  const gatewayUrl = new URL(script?.dataset.authGateway || "./", window.location.href);
  const concealStyle = document.createElement("style");
  concealStyle.textContent = "html:not([data-auth-ready='true']) { visibility: hidden; }";
  document.head.append(concealStyle);

  // Verifica la sessione server e lo sblocco della Chiave valido nella scheda corrente.
  async function verifyPageAccess() {
    try {
      const response = await fetch(new URL("api/auth/session", gatewayUrl), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const result = response.ok ? await response.json() : null;
      const unlockedUserId = sessionStorage.getItem(ACCESS_SESSION_KEY);

      if (result?.authenticated && unlockedUserId === String(result.user.id)) {
        document.documentElement.dataset.authReady = "true";
        concealStyle.remove();
        window.dispatchEvent(new CustomEvent("mondo-bianco-auth-ready", { detail: result.user }));
        return;
      }
    } catch (error) {
      console.warn("Impossibile verificare l'accesso alla pagina:", error);
    }

    redirectToAccess();
  }

  // Conserva l'indirizzo interno richiesto e apre il punto di accesso del Mondo Bianco.
  function redirectToAccess() {
    const returnTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem(RETURN_TARGET_KEY, returnTarget);
    gatewayUrl.searchParams.set("returnTo", returnTarget);
    window.location.replace(gatewayUrl.href);
  }

  void verifyPageAccess();
})();
