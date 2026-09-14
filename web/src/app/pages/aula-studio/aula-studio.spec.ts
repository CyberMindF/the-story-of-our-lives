import { parseStudyPairs } from './aula-studio';

describe('parseStudyPairs', () => {
  it('creates one card for each question and answer pair', () => {
    expect(parseStudyPairs('Domanda 1\nRisposta 1\n\nDomanda 2\nRisposta 2')).toEqual({
      cards: [
        { question: 'Domanda 1', answer: 'Risposta 1' },
        { question: 'Domanda 2', answer: 'Risposta 2' },
      ],
      danglingQuestion: null,
    });
  });

  it('reports the last question when its answer is missing', () => {
    expect(parseStudyPairs('Domanda\nRisposta\nDomanda senza risposta')).toEqual({
      cards: [{ question: 'Domanda', answer: 'Risposta' }],
      danglingQuestion: 'Domanda senza risposta',
    });
  });
});
