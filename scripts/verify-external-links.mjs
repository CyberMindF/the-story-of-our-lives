import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDirectory = path.join(projectRoot, "reports", "export");
const analysisPath = path.join(reportDirectory, "notion-export-analysis.json");
const outputPath = path.join(reportDirectory, "external-links-verification.json");

// Verifica i link unici senza stampare in console gli URL personali completi.
async function main() {
  const analysis = JSON.parse(await readFile(analysisPath, "utf8"));
  const links = uniqueLinks(analysis.pages.flatMap((page) => [
    ...page.links.filter((link) => link.external).map((link) => ({ ...link, page: page.title })),
    ...page.externalResources.map((resource) => ({ ...resource, label: `[${resource.type}]`, page: page.title }))
  ]));
  const results = [];

  for (const [index, link] of links.entries()) {
    const result = await verifyLink(link);
    results.push(result);
    console.log(`[${index + 1}/${links.length}] ${result.domain}: ${result.status ?? result.outcome}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: summarize(results),
    results
  };
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report creato: ${path.relative(projectRoot, outputPath)}`);
}

// Usa curl in un processo isolato, segue i redirect e non scarica il corpo della pagina.
async function verifyLink(link) {
  const domain = new URL(link.href).hostname;
  try {
    const stdout = execFileSync("curl", [
      "--location",
      "--silent",
      "--show-error",
      "--output", "/dev/null",
      "--max-time", "15",
      "--user-agent", "MondoBiancoLinkVerifier/1.0",
      "--write-out", "%{http_code}\t%{url_effective}",
      link.href
    ], { encoding: "utf8" });
    const [statusText, finalUrl] = stdout.trim().split("\t");
    const status = Number.parseInt(statusText, 10);
    return {
      ...link,
      domain,
      status,
      finalUrl,
      outcome: status >= 200 && status < 400 ? "reachable" : classifyStatus(status)
    };
  } catch (error) {
    return { ...link, domain, status: null, finalUrl: null, outcome: "network-error", error: error.message };
  }
}

// Distingue link rotti da provider che richiedono una verifica manuale o autenticazione.
function classifyStatus(status) {
  if ([401, 403, 405, 429].includes(status)) return "manual-check";
  if (status >= 500) return "provider-error";
  return "unreachable";
}

// Elimina URL duplicati conservando tutte le pagine che li referenziano.
function uniqueLinks(links) {
  const unique = new Map();
  for (const link of links) {
    const existing = unique.get(link.href);
    if (existing) {
      existing.pages.push(link.page);
    } else {
      unique.set(link.href, { href: link.href, label: link.label, pages: [link.page] });
    }
  }
  return [...unique.values()];
}

// Produce un riepilogo aggregato per esito.
function summarize(results) {
  return results.reduce((totals, result) => {
    totals.total += 1;
    totals[result.outcome] = (totals[result.outcome] || 0) + 1;
    return totals;
  }, { total: 0 });
}

await main();
