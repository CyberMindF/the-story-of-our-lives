export const CARD_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const CARD_IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const CARD_IMAGE_ERROR = 'Scegli o incolla un’immagine JPG, PNG o WebP non vuota, fino a 15 MB.';

export function cardImageError(file: File): string | null {
  return CARD_IMAGE_TYPES.includes(file.type as (typeof CARD_IMAGE_TYPES)[number])
    && file.size > 0 && file.size <= CARD_IMAGE_MAX_BYTES ? null : CARD_IMAGE_ERROR;
}

// Non usa navigator.clipboard.read(): il file arriva direttamente dall'evento paste,
// quindi non richiede un secondo permesso del browser e funziona anche con gli screenshot.
export function imageFromClipboard(event: ClipboardEvent): File | null {
  const items = Array.from(event.clipboardData?.items ?? []);
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith('image/')) ?? null;
}
