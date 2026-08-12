import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Supporto minimo e controllato ai link interni (inventario contenuti CMS.md, decisione #6):
// solo la sintassi esplicita [etichetta](/rotta), mai HTML libero o URL esterni. Estratto da
// EditorialText per essere riusato anche dai blocchi del GDR (paragrafi/callout), invece di
// duplicare la stessa regex in due posti.
export function renderInlineLinks(sanitizer: DomSanitizer, text: string): SafeHtml {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withLinks = escaped.replace(
    /\[([^[\]]{1,80})\]\((\/[a-z0-9\-/]*)\)/gi,
    (_match, label: string, route: string) => `<a class="editorial-inline-link" href="${route}">${label}</a>`
  );
  return sanitizer.bypassSecurityTrustHtml(withLinks.replace(/\n/g, '<br>'));
}
