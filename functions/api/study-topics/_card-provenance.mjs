// L'editor invia le coppie complete: conserva la provenienza delle carte rimaste
// identiche, anche se sono state riordinate. Le coppie nuove sono modifiche manuali.
export function preserveCardImportSources(cards, existingCards) {
  const sourcesByPair = new Map();
  const pairKey = (card) => JSON.stringify([card.question, card.answer]);
  for (const card of existingCards) {
    const key = pairKey(card);
    if (!sourcesByPair.has(key)) sourcesByPair.set(key, []);
    sourcesByPair.get(key).push(card.source_import_id ?? null);
  }
  return cards.map((card) => ({
    ...card,
    sourceImportId: sourcesByPair.get(pairKey(card))?.shift() ?? null,
  }));
}
