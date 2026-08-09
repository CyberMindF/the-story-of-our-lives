import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages } from "./world-pages.manifest.mjs";

// Genera le pagine del Mondo Bianco da un unico template condiviso (header, userbar con
// selettore tema, logout) + un frammento di contenuto per pagina. Gli index.html prodotti
// restano file statici normali: Cloudflare Pages continua a servirli senza alcun passo di
// build lato server. Da qui in poi si modifica il template o il contenuto sorgente, non
// l'HTML finale a mano — coerente con la regola "zero codice duplicato" in CLAUDE.md.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function build() {
  const template = await readFile(path.join(root, "templates/world-page.html"), "utf8");

  for (const page of pages) {
    const depth = page.output.split("/").length - 1;
    const base = "../".repeat(depth);
    const content = await readFile(path.join(root, page.content), "utf8");

    const extraHead = (page.extraHead?.(base) || []).join("\n");
    const extraScripts = (page.extraScripts?.(base) || []).join("\n");
    const extraBody = page.extraBody
      ? (await readFile(path.join(root, page.extraBody), "utf8")).trimEnd()
      : "";
    const suggestLink = page.hideSuggestLink
      ? ""
      : `          <a href="${base}suggerimenti/" class="suggest-link" aria-label="Manda un suggerimento" title="Suggerisci">\n`
        + `            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 2.5 1.4 3.8 2.2 4.6.5.5.8 1.1.8 1.4h6c0-.3.3-.9.8-1.4.8-.8 2.2-2.1 2.2-4.6a6 6 0 0 0-6-6Z" /></svg>\n`
        + `          </a>`;

    // {{BASE}} può comparire anche dentro i frammenti di contenuto e negli altri campi del
    // manifest, quindi va sostituito per ultimo, dopo aver inserito tutto il resto.
    const html = template
      .replaceAll("{{TITLE}}", page.title)
      .replaceAll("{{BODY_CLASS}}", page.bodyClass)
      .replaceAll("{{SHELL_CLASS}}", page.shellClass || "")
      .replaceAll("{{LOGOUT_URL}}", base)
      .replaceAll("{{HEADER_EXTRA_CLASS}}", page.headerExtraClass ? ` ${page.headerExtraClass}` : "")
      .replaceAll("{{USERBAR_EXTRA_CLASS}}", page.userbarExtraClass ? ` ${page.userbarExtraClass}` : "")
      .replaceAll("{{HOME_LINK_EXTRA_CLASS}}", page.homeLinkExtraClass ? ` ${page.homeLinkExtraClass}` : "")
      .replaceAll("{{HOME_HREF}}", page.homeHref)
      .replaceAll("{{HOME_ARIA}}", page.homeAria)
      .replaceAll("{{HOME_LINK_INNER}}", page.homeLinkInner)
      .replaceAll("{{EXTRA_HEAD}}", extraHead)
      .replaceAll("{{CONTENT}}", content.trimEnd())
      .replaceAll("{{EXTRA_BODY}}", extraBody)
      .replaceAll("{{SUGGEST_LINK}}", suggestLink)
      .replaceAll("{{EXTRA_SCRIPTS}}", extraScripts)
      .replaceAll("{{BASE}}", base);

    // Quando EXTRA_HEAD/EXTRA_BODY/EXTRA_SCRIPTS sono vuoti (pagina senza risorse extra) resta
    // una riga vuota di troppo prima del prossimo tag: la rimuove senza toccare la
    // formattazione del contenuto vero e proprio.
    const cleanedHtml = html.replace(/\n[ \t]*\n(?=[ \t]*(<\/head>|<\/body>|<script|<button))/g, "\n");

    const outputPath = path.join(root, page.output);
    await writeFile(outputPath, cleanedHtml, "utf8");
    console.log(`built ${page.output}`);
  }
}

await build();
