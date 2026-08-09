import { readApiResponse } from "./api.js";

export const ACCESS_SESSION_KEY = "noi-crossword-access-session-v1";
const KNOWN_ACCOUNT_STORAGE_KEY = "noi-crossword-known-account-v1";

// Chiede al backend se il cookie HttpOnly identifica ancora una sessione valida.
export async function loadAuthSession() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return await readApiResponse(response);
  } catch (error) {
    console.warn("Impossibile verificare la sessione:", error);
    return { authenticated: false };
  }
}

// Invia registrazione, login o conferma della sola Chiave all'endpoint corretto.
export async function submitAuthRequest(mode, payload) {
  const endpoint = mode === "key" ? "/api/auth/session" : `/api/auth/${mode}`;
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { response, result: await readApiResponse(response) };
}

// Revoca la sessione corrente sul backend.
export async function revokeAuthSession() {
  return fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "same-origin"
  });
}

// Restituisce la modalità iniziale più adatta in base alla presenza di un account già usato.
export function getInitialAccessMode() {
  return localStorage.getItem(KNOWN_ACCOUNT_STORAGE_KEY) === "true" ? "login" : "register";
}

// Verifica se la Chiave è già stata confermata in questa scheda per l'utente corrente.
export function isAccessUnlocked(userId) {
  return sessionStorage.getItem(ACCESS_SESSION_KEY) === String(userId);
}

// Memorizza lo sblocco della scheda e, dopo login o registrazione, la presenza dell'account.
export function rememberAccessUnlock(userId, rememberAccount = false) {
  sessionStorage.setItem(ACCESS_SESSION_KEY, String(userId));
  if (rememberAccount) {
    localStorage.setItem(KNOWN_ACCOUNT_STORAGE_KEY, "true");
  }
}

// Rimuove soltanto lo sblocco locale della scheda, senza cancellare progresso o preferenze.
export function clearAccessUnlock() {
  sessionStorage.removeItem(ACCESS_SESSION_KEY);
}
