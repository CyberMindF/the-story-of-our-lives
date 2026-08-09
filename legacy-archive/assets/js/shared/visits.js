// Registra la visita prima dell'autenticazione senza bloccare l'accesso in caso di errore.
export async function captureAnonymousVisit() {
  try {
    const response = await fetch("/api/visits", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body}`);
    }
  } catch (error) {
    console.warn("Impossibile registrare la visita anonima:", error);
  }
}
