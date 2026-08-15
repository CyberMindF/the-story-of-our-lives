import { getAuthenticatedSession, json } from "../auth/_shared.js";

// Endpoint di sola lettura per Album e Apertura (#e4, Blocco 3) — distinto dagli endpoint CRUD
// dell'editor admin (carte-sets/carte-designs/carte-definizioni), che restano di competenza di
// quel lavoro. Qui serve solo il catalogo completo con, per ciascuna carta, il possesso di
// entrambe le identità: la vista comparativa dell'album (richiesta esplicita di Rory, due
// griglie sincronizzate) non ha bisogno di una seconda chiamata o di un endpoint dedicato a
// "guardare l'album dell'altro" — sono sempre e solo le due identità della coppia.
//
// Ogni design ha uno slot per ciascuna delle 5 finiture fisse, anche se nessuno l'ha ancora mai
// pescata (carta_definizione_id null in quel caso): l'album mostra comunque lo slot vuoto
// (richiesta esplicita di Rory, "griglia fissa con slot vuoti").
const FINITURE = ["flat", "argento", "oro", "smeraldo", "rubino", "zaffiro", "diamante"];

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const session = await getAuthenticatedSession(request, env);
    if (!session) return json({ error: "Sessione non valida o scaduta." }, 401);

    const identityMia = session.user.identity;
    const identityAltro = identityMia === "lui" ? "lei" : "lui";

    const { results } = await env.DB
      .prepare(
        `SELECT
           s.id AS set_id, s.nome AS set_nome,
           des.id AS design_id, des.nome AS design_nome, des.immagine_key AS design_immagine_key,
           f.finitura AS finitura,
           cd.id AS definizione_id, cd.immagine_key AS definizione_immagine_key,
           COALESCE(pm.quantita, 0) AS quantita_mia,
           COALESCE(pa.quantita, 0) AS quantita_altro
         FROM carte_designs des
         JOIN carte_sets s ON s.id = des.set_id
         CROSS JOIN (
           -- VALUES invece di più SELECT ... UNION ALL: con 7 finiture il compound SELECT
           -- supera il limite imposto da D1 ("too many terms in compound SELECT"), VALUES no.
           SELECT column1 AS finitura FROM (
             VALUES ('flat'), ('argento'), ('oro'), ('smeraldo'), ('rubino'), ('zaffiro'), ('diamante')
           )
         ) f
         LEFT JOIN carte_definizioni cd ON cd.design_id = des.id AND cd.finitura = f.finitura
         LEFT JOIN carte_possesso pm ON pm.carta_definizione_id = cd.id AND pm.owner_identity = ?
         LEFT JOIN carte_possesso pa ON pa.carta_definizione_id = cd.id AND pa.owner_identity = ?
         ORDER BY s.position, des.position`
      )
      .bind(identityMia, identityAltro)
      .all();

    const finituraRank = new Map(FINITURE.map((finitura, index) => [finitura, index]));
    const carte = results
      .map((row) => ({
        definizioneId: row.definizione_id !== null ? String(row.definizione_id) : null,
        finitura: row.finitura,
        designId: String(row.design_id),
        designNome: row.design_nome,
        setId: String(row.set_id),
        setNome: row.set_nome,
        immagineKey: row.definizione_immagine_key ?? row.design_immagine_key,
        quantitaMia: row.quantita_mia,
        quantitaAltro: row.quantita_altro
      }))
      .sort((a, b) => finituraRank.get(a.finitura) - finituraRank.get(b.finitura));

    return json({ identityMia, identityAltro, carte });
  } catch (error) {
    console.error(JSON.stringify({ event: "carte_collezione_error", message: error.message }));
    return json({ error: "Non è stato possibile leggere la collezione." }, 500);
  }
}
