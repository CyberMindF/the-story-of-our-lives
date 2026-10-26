import { describe, expect, it } from 'vitest';
import { insertNarrativeBlock, narrativeSnippet } from './gdr-writing';
import { parseNarrative } from './gdr-turn.parser';

describe('inserimento nel racconto', () => {
  it('inserisce fra due paragrafi uguali senza confondere o riscrivere i blocchi', () => {
    const source = 'Testo uguale.\n\n::: dialogo Ada\nCiao.\n:::\n\nTesto uguale.';
    const offset = source.lastIndexOf('Testo uguale.');
    const inserted = '## Un nuovo capitolo';
    const result = insertNarrativeBlock(source, offset, inserted);
    expect(result).toBe(source.slice(0, offset) + inserted + '\n\n' + source.slice(offset));
    expect(parseNarrative(result).errors).toEqual([]);
    expect(parseNarrative(result).sections.map((s) => s.kind)).toEqual([
      'document',
      'dialogo',
      'document',
    ]);
  });
  it('gestisce inizio, fine e documento vuoto mantenendo separati i blocchi', () => {
    expect(insertNarrativeBlock('', 0, 'Primo testo.')).toBe('Primo testo.');
    expect(insertNarrativeBlock('## Fine', 0, 'Inizio.')).toBe('Inizio.\n\n## Fine');
    expect(insertNarrativeBlock('## Inizio', 9, 'Fine.')).toBe('## Inizio\n\nFine.');
    expect(insertNarrativeBlock('Prima.\n\n', 8, 'Dopo.')).toBe('Prima.\n\nDopo.');
  });
  it('conserva emoji e ritorni a capo Windows del contenuto esistente', () => {
    const source = '🪄 Prima.\r\n\r\n## Dopo';
    const offset = source.indexOf('##');
    const result = insertNarrativeBlock(source, offset, 'Un incontro.');
    expect(result).toBe(source.slice(0, offset) + 'Un incontro.\r\n\r\n## Dopo');
    expect(parseNarrative(result).errors).toEqual([]);
  });
  it('usa la stessa sintassi e la voce scelta in entrambi gli editor', () => {
    const snippet = narrativeSnippet('dialogo', 'Le mie parole.', {
      name: 'Ada\n|PNG',
      portrait: '/api/media/gdr/ada.webp',
    });
    const section = parseNarrative(snippet).sections[0];
    expect(section.speaker).toBe('Ada  PNG');
    expect(section.portrait).toBe('/api/media/gdr/ada.webp');
    expect(section.text).toBe('Le mie parole.');
    expect(
      narrativeSnippet('dialogo', '', { name: 'Ada', portrait: 'javascript:alert(1)' }),
    ).not.toContain('javascript');
  });
});
