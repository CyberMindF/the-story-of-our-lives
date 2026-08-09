# Fonti non pubblicate

Questa cartella conserva materiali necessari per rigenerare o verificare i contenuti, ma che
non devono entrare nella build Angular.

- `notion-original/`: testi estratti dall'export Notion originale.
- `image-originals/`: PNG sorgente sostituiti nell'app dalle versioni WebP.
- `manifests/`: manifest operativi usati dagli script di import e manutenzione.
- `migration-reports/`: analisi originale, inventari e verifiche storiche prodotti durante
  la migrazione. Non rappresentano la roadmap corrente.

Gli originali non vanno copiati in `web/public`: `scripts/optimize-world-images.mjs` genera
le versioni WebP pubbliche nelle rispettive cartelle degli asset.
