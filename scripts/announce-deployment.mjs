const version = process.env.DEPLOY_VERSION?.trim();
const siteUrl = (process.env.DEPLOY_SITE_URL || 'https://il-mondo-bianco.com').replace(/\/$/, '');

if (!version) throw new Error('DEPLOY_VERSION è obbligatorio.');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let published = false;

for (let attempt = 1; attempt <= 90; attempt += 1) {
  try {
    const response = await fetch(`${siteUrl}/build-version.json?t=${Date.now()}`, { cache: 'no-store' });
    const body = response.ok ? await response.json() : null;
    if (body?.version === version) {
      published = true;
      break;
    }
  } catch {
    // Il dominio può essere momentaneamente irraggiungibile mentre Pages pubblica la build.
  }

  console.log(`Build non ancora disponibile (${attempt}/90), nuovo controllo tra 10 secondi…`);
  await wait(10_000);
}

if (!published) throw new Error(`La build ${version} non è comparsa su ${siteUrl} entro 15 minuti.`);

const response = await fetch(`${siteUrl}/api/deploy-notify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ version })
});

if (!response.ok) {
  throw new Error(`Notifica deploy rifiutata (${response.status}): ${await response.text()}`);
}

console.log(`Evento realtime inviato per la build ${version}.`);
