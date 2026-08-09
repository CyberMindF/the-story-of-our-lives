import { sendAuthenticatedJson } from "./api.js";

// Invia un evento di telemetria senza mai interrompere l'esperienza in caso di errore.
export async function trackEvent(section, eventType, metadata = {}) {
  return sendAuthenticatedJson("/api/telemetry/events", { section, eventType, metadata });
}

// Deriva la sezione dal primo segmento del percorso, così ogni pagina nuova viene già
// tracciata senza dover toccare di nuovo questo file (es. /tavolo-da-gioco/gdr/... -> "tavolo-da-gioco").
export function sectionFromPath(pathname = window.location.pathname) {
  const segment = pathname.split("/").find(Boolean);
  return segment ? segment.toLowerCase() : "root";
}
