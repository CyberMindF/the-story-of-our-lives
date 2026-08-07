const RETURN_TARGET_KEY = "mondo-bianco-return-target-v1";

// Memorizza il parametro returnTo soltanto se rappresenta una destinazione interna sicura.
export function rememberRequestedDestination() {
  const requestedTarget = new URLSearchParams(window.location.search).get("returnTo");
  if (!requestedTarget) {
    return;
  }

  const safeTarget = getSafeReturnTarget(requestedTarget);
  if (safeTarget) {
    sessionStorage.setItem(RETURN_TARGET_KEY, safeTarget);
  } else {
    sessionStorage.removeItem(RETURN_TARGET_KEY);
    console.warn("Destinazione successiva all'accesso non valida.");
  }
}

// Consuma la destinazione salvata e vi reindirizza il browser dopo un accesso riuscito.
export function returnToRequestedDestination() {
  const savedTarget = sessionStorage.getItem(RETURN_TARGET_KEY);
  const safeTarget = getSafeReturnTarget(savedTarget);
  sessionStorage.removeItem(RETURN_TARGET_KEY);

  if (!safeTarget) {
    return false;
  }

  window.location.replace(safeTarget);
  return true;
}

// Accetta esclusivamente URL dello stesso sito, escludendo API e ritorni alla pagina corrente.
export function getSafeReturnTarget(value) {
  if (!value) {
    return null;
  }

  try {
    const target = new URL(value, window.location.origin);
    const currentPath = normalizePagePath(window.location.pathname);
    const targetPath = normalizePagePath(target.pathname);

    if (target.origin !== window.location.origin || target.pathname.startsWith("/api/")) {
      return null;
    }
    if (targetPath === currentPath) {
      return null;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

// Considera equivalenti una directory e il relativo file index.html.
function normalizePagePath(pathname) {
  return pathname.replace(/\/index\.html$/, "/");
}
