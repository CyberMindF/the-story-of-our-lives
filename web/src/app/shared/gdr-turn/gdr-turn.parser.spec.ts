import { describe, expect, it } from 'vitest';
import { parseNarrative, safeNarrativeImage } from './gdr-turn.parser';
import { parseGdrMarkdown } from '../gdr-blocks/gdr-markdown.parser';

describe('testo narrativo GDR', () => {
  it('mantiene il parser e i tipi dei documenti già presenti', () => {
    const source =
      '## Titolo\n\nUn testo.\n\n::: callout Attenzione\nUna nota.\n:::\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';
    const result = parseNarrative(source);
    expect(result.errors).toEqual([]);
    expect(
      result.sections.flatMap((s) => s.blocks.map(({ type, data }) => ({ type, data }))),
    ).toEqual(parseGdrMarkdown(source).blocks);
  });
  it('mantiene ordine e testo fra più dialoghi e azioni', () => {
    const result = parseNarrative(
      'Prima.\n\n::: dialogo Ada\nUna battuta.\nAncora.\n:::\n\n::: azione\nSi alza.\n:::\n\nDopo.',
    );
    expect(result.errors).toEqual([]);
    expect(result.sections.map((s) => s.kind)).toEqual([
      'document',
      'dialogo',
      'azione',
      'document',
    ]);
    expect(result.sections[1].text).toBe('Una battuta.\nAncora.');
    expect(result.sections[3].blocks[0].data).toEqual({ text: 'Dopo.' });
  });
  it('segnala la chiusura mancante senza perdere il testo incompleto', () => {
    const result = parseNarrative('Inizio.\n\n::: dialogo Ada\nIl testo non va perso.');
    expect(result.errors[0].line).toBe(3);
    expect(JSON.stringify(result.sections)).toContain('Il testo non va perso.');
  });
  it('non interpreta comandi narrativi dentro un callout esistente', () => {
    const result = parseNarrative('::: callout Sintassi\n::: dialogo Esempio\n:::');
    expect(result.errors).toEqual([]);
    expect(result.sections.map((s) => s.kind)).toEqual(['document']);
    expect(result.sections[0].blocks[0].data).toEqual({
      lead: 'Sintassi',
      text: '::: dialogo Esempio',
    });
  });
  it('accetta solo percorsi dei ritratti locali e dei media autenticati', () => {
    expect(safeNarrativeImage('/assets/pg.webp')).toBe('/assets/pg.webp');
    expect(safeNarrativeImage('/api/media/gdr/pg.jpg')).toBe('/api/media/gdr/pg.jpg');
    for (const url of [
      'javascript:alert(1)',
      'https://example.com/pg.jpg',
      '/assets/../pg.jpg',
      '/assets/%2e%2e/pg.jpg',
      '/api/auth/session',
    ])
      expect(safeNarrativeImage(url)).toBe('');
  });
});

describe('posizioni per la modifica rapida', () => {
  it('isola titoli, paragrafi ripetuti e dialoghi senza toccare il resto', () => {
    const source = '## Titolo\n\nTesto uguale.\n\n::: dialogo Ada\nCiao.\n:::\n\nTesto uguale.';
    const parsed = parseNarrative(source);
    const ranges = parsed.sections.flatMap((s) =>
      s.kind === 'document' ? s.ranges : [{ start: s.start, end: s.end }],
    );
    expect(ranges.map((r) => source.slice(r.start, r.end))).toEqual([
      '## Titolo',
      'Testo uguale.',
      '::: dialogo Ada\nCiao.\n:::',
      'Testo uguale.',
    ]);
    const last = ranges.at(-1)!;
    expect(source.slice(0, last.start) + 'Nuovo testo.' + source.slice(last.end)).toBe(
      source.replace(/Testo uguale\.$/, 'Nuovo testo.'),
    );
  });
  it('mantiene gli offset con emoji e ritorni a capo Windows', () => {
    const source = '🪄 Inizio.\r\n\r\n::: dialogo Ada\r\nUna voce.\r\n:::\r\n\r\n## Fine';
    const result = parseNarrative(source);
    expect(source.slice(result.sections[1].start, result.sections[1].end)).toBe(
      '::: dialogo Ada\r\nUna voce.\r\n:::',
    );
    expect(source.slice(result.sections[2].ranges[0].start, result.sections[2].ranges[0].end)).toBe(
      '## Fine',
    );
  });
  it('considera un blocco PNG o una tabella come una sola unità modificabile', () => {
    const source =
      '::: npc\n- image: /assets/a.webp\n  alt: Ada\n  name: Ada\n  description: Una maga.\n:::\n\n| A | B |\n| --- | --- |\n| 1 | 2 |';
    const result = parseNarrative(source);
    expect(result.sections[0].ranges).toHaveLength(2);
    expect(result.sections[0].blocks.map((b) => b.type)).toEqual(['npc_grid', 'table']);
  });
});
