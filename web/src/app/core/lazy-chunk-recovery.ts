const CHUNK_RELOAD_KEY = 'mondo-bianco-chunk-reload-v1';
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

interface ChunkReloadAttempt {
  version: string;
  attemptedAt: number;
}

export function isLazyChunkLoadError(error: unknown): boolean {
  const message = lazyChunkErrorMessage(error);

  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading chunk .+ failed|chunkloaderror/i.test(
    message,
  );
}

export function lazyChunkUrl(error: unknown): string | null {
  const match = lazyChunkErrorMessage(error).match(/https?:\/\/[^\s'"()]+\.js(?:\?[^\s'"()]*)?/i);
  return match?.[0] ?? null;
}

export async function recoverFromLazyChunkError(error: unknown): Promise<boolean> {
  if (!isLazyChunkLoadError(error)) return false;

  const version =
    document.querySelector<HTMLMetaElement>('meta[name="app-version"]')?.content || 'unknown';
  const now = Date.now();

  try {
    const stored = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    const previous = stored ? (JSON.parse(stored) as Partial<ChunkReloadAttempt>) : null;
    if (
      previous?.version === version &&
      typeof previous.attemptedAt === 'number' &&
      now - previous.attemptedAt < CHUNK_RELOAD_COOLDOWN_MS
    ) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ version, attemptedAt: now }));
  } catch {
    // In navigazione privata lo storage può essere indisponibile: la query cache-busting
    // rende comunque utile il tentativo di riallineamento degli asset.
  }

  const failedChunkUrl = lazyChunkUrl(error);
  if (failedChunkUrl) {
    try {
      const url = new URL(failedChunkUrl, window.location.origin);
      if (url.origin === window.location.origin) {
        // Sovrascrive l'eventuale risposta HTML del fallback SPA rimasta nella cache
        // sotto l'URL del modulo prima di ricaricare il documento.
        await fetch(url, { cache: 'reload', headers: { Accept: 'application/javascript' } });
      }
    } catch {
      // Il reload cache-busted resta comunque il fallback corretto.
    }
  }

  const reloadUrl = new URL(window.location.href);
  reloadUrl.searchParams.set('__asset_retry', String(now));
  window.location.replace(reloadUrl.toString());
  return true;
}

function lazyChunkErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : String((error as { message?: unknown } | null)?.message ?? '');
}
