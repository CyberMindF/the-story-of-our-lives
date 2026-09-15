const version = process.env.DEPLOY_VERSION?.trim();
const siteUrl = (process.env.DEPLOY_SITE_URL || 'https://il-mondo-bianco.com').replace(/\/$/, '');

if (!version) throw new Error('DEPLOY_VERSION è obbligatorio.');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let published = false;
let consecutiveReadyChecks = 0;

for (let attempt = 1; attempt <= 90; attempt += 1) {
  try {
    const response = await fetch(`${siteUrl}/build-version.json?t=${Date.now()}`, { cache: 'no-store' });
    const body = response.ok ? await response.json() : null;
    if (body?.version === version && await deploymentAssetsAreReady()) {
      consecutiveReadyChecks += 1;
      console.log(`Build e chunk disponibili (${consecutiveReadyChecks}/3 controlli consecutivi).`);
      if (consecutiveReadyChecks >= 3) {
        published = true;
        break;
      }
    } else {
      consecutiveReadyChecks = 0;
    }
  } catch {
    consecutiveReadyChecks = 0;
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

async function deploymentAssetsAreReady() {
  const indexResponse = await fetch(`${siteUrl}/?asset-check=${Date.now()}`, { cache: 'no-store' });
  if (!indexResponse.ok || !indexResponse.headers.get('content-type')?.includes('text/html')) {
    return false;
  }

  const indexHtml = await indexResponse.text();
  const pending = [...indexHtml.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
    .map((match) => new URL(match[1], `${siteUrl}/`).href);
  const checked = new Set();

  while (pending.length > 0) {
    const assetUrl = pending.pop();
    if (!assetUrl || checked.has(assetUrl)) continue;
    checked.add(assetUrl);

    const assetResponse = await fetch(assetUrl, { cache: 'no-store' });
    const contentType = assetResponse.headers.get('content-type') || '';
    const isScript = new URL(assetUrl).pathname.endsWith('.js');
    const expectedType = isScript ? 'javascript' : 'text/css';
    if (!assetResponse.ok || !contentType.includes(expectedType)) {
      console.log(`Asset non ancora pronto: ${assetUrl} (${assetResponse.status}, ${contentType || 'senza content-type'})`);
      return false;
    }

    if (!isScript) continue;
    const source = await assetResponse.text();
    for (const match of source.matchAll(/["'`](\.\/[^"'`]+\.js)["'`]/g)) {
      const dependencyUrl = new URL(match[1], assetUrl).href;
      if (!checked.has(dependencyUrl)) pending.push(dependencyUrl);
    }
  }

  return checked.size > 0;
}
