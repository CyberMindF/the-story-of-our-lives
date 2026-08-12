// Fase 2 del CMS (documentazione/cms/planning-editor-contenuti.md): i ruoli assegnano permessi espliciti nel
// codice, non c'è ancora un editor visuale — ma ogni endpoint controlla il singolo permesso,
// non il ruolo direttamente, così domani si potrà cambiare l'associazione senza toccare le API.
const ROLE_PERMISSIONS = {
  member: new Set(["content.read"]),
  admin: new Set([
    "content.read",
    "content.edit",
    "content.create",
    "content.delete",
    "content.reorder",
    "events.view",
    "users.manage"
  ])
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.has(permission) === true;
}
