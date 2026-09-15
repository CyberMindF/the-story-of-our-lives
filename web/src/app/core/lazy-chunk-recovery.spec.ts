import { isLazyChunkLoadError, lazyChunkUrl } from './lazy-chunk-recovery';

describe('isLazyChunkLoadError', () => {
  it('recognizes the dynamic import error emitted during an incomplete asset rollout', () => {
    expect(
      isLazyChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://il-mondo-bianco.com/chunk-example.js',
        ),
      ),
    ).toBe(true);
  });

  it('recognizes the equivalent browser and bundler messages', () => {
    expect(isLazyChunkLoadError('Importing a module script failed.')).toBe(true);
    expect(isLazyChunkLoadError('Loading chunk aula-studio failed')).toBe(true);
    expect(isLazyChunkLoadError({ message: 'ChunkLoadError' })).toBe(true);
  });

  it('does not reload for application errors unrelated to assets', () => {
    expect(isLazyChunkLoadError(new Error('Accesso non riuscito.'))).toBe(false);
  });

  it('extracts the failed asset URL so its cached response can be refreshed', () => {
    expect(
      lazyChunkUrl(
        'Failed to fetch dynamically imported module: https://il-mondo-bianco.com/chunk-example.js',
      ),
    ).toBe('https://il-mondo-bianco.com/chunk-example.js');
    expect(lazyChunkUrl('Loading chunk aula-studio failed')).toBeNull();
  });
});
