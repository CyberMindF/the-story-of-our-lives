// Legge una risposta JSON e restituisce un oggetto vuoto quando il corpo non è valido.
export async function readApiResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

// Invia JSON a un endpoint autenticato senza interrompere l'interfaccia in caso di errore di rete.
export async function sendAuthenticatedJson(endpoint, payload, method = "POST") {
  try {
    const response = await fetch(endpoint, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return response.ok;
  } catch (error) {
    console.warn(`Impossibile completare la richiesta ${method} ${endpoint}:`, error);
    return false;
  }
}
