import {
  buildFolderChoices,
  buildStudyTopicPath,
  collectFolderStudyCards,
  parseStudyPairs,
} from './aula-studio';

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

describe('buildFolderChoices', () => {
  it('orders folders as a navigable tree and indents nested folders', () => {
    const timestamp = '2026-09-15T12:00:00.000Z';
    expect(
      buildFolderChoices([
        { id: 3, name: 'Unità 2', parentId: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 2, name: 'Unità 1', parentId: 1, createdAt: timestamp, updatedAt: timestamp },
        { id: 1, name: 'Biologia', parentId: null, createdAt: timestamp, updatedAt: timestamp },
        { id: 4, name: 'Arte', parentId: null, createdAt: timestamp, updatedAt: timestamp },
      ]).map(({ id, label }) => ({ id, label })),
    ).toEqual([
      { id: 4, label: 'Arte' },
      { id: 1, label: 'Biologia' },
      { id: 2, label: '— Unità 1' },
      { id: 3, label: '— Unità 2' },
    ]);
  });
});

describe('folder study deck', () => {
  const timestamp = '2026-09-15T12:00:00.000Z';
  const folders = [
    { id: 1, name: 'Biologia', parentId: null, createdAt: timestamp, updatedAt: timestamp },
    { id: 2, name: 'Unità 1', parentId: 1, createdAt: timestamp, updatedAt: timestamp },
    { id: 3, name: 'Unità 2', parentId: 1, createdAt: timestamp, updatedAt: timestamp },
  ];
  const topics = [
    {
      id: 10,
      title: 'Lipidi',
      folderId: 2,
      cards: [{ question: 'Cosa sono?', answer: 'Biomolecole.' }],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 11,
      title: 'Proteine',
      folderId: 3,
      cards: [{ question: 'Da cosa sono formate?', answer: 'Amminoacidi.' }],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  it('includes cards from every descendant folder and adds their complete path', () => {
    expect(collectFolderStudyCards(folders, topics, 1)).toEqual([
      {
        question: 'Cosa sono?',
        answer: 'Biomolecole.',
        context: 'Biologia › Unità 1 › Lipidi',
      },
      {
        question: 'Da cosa sono formate?',
        answer: 'Amminoacidi.',
        context: 'Biologia › Unità 2 › Proteine',
      },
    ]);
  });

  it('builds the same path for a single-topic review', () => {
    expect(buildStudyTopicPath(folders, topics[0])).toBe('Biologia › Unità 1 › Lipidi');
  });
});
