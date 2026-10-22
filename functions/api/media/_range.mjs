// Accetta una sola porzione, che è quanto chiedono i player HTML5. Evitiamo di consegnare
// l'intero video quando il browser vuole soltanto i primi byte per durata e anteprima.
export function parseByteRange(value, size) {
  const match = typeof value === 'string' ? /^bytes=(\d*)-(\d*)$/.exec(value.trim()) : null;
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(size) || size <= 0) return null;

  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }

  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(requestedEnd) || offset >= size || requestedEnd < offset) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset, length: end - offset + 1 };
}

export function applyByteRangeHeaders(headers, range, fullSize) {
  const end = range.offset + range.length - 1;
  headers.set('Content-Range', `bytes ${range.offset}-${end}/${fullSize}`);
  headers.set('Content-Length', String(range.length));
}
