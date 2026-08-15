import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Da usare dopo authGuard sulle rotte riservate (documentazione/cms/planning-editor-contenuti.md, Fase 6): la
// pagina non deve comparire per un istante durante il controllo permessi, quindi si affida allo
// stesso currentUser già risolto da authGuard invece di rifare una chiamata di rete. La vera
// barriera resta comunque il backend: senza il permesso specifico (es. events.view) l'endpoint
// risponde 403 indipendentemente da questa guardia.
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
