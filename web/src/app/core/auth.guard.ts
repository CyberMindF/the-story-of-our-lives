import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NavigationService } from './navigation.service';

// Sostituisce il trucco di auth-guard.js (che nascondeva <html> con un CSS injectato finché
// window.mondoBiancoAuthReady non risolveva). Qui il Router non attiva affatto la rotta finché
// questa guardia non risolve, quindi il risultato — niente contenuto protetto visibile prima
// del check — è lo stesso, senza bisogno del workaround CSS.
//
// Stessa logica di verifica dell'originale: sessione valida (cookie) E Chiave già confermata
// in questa scheda (sessionStorage). Se manca una delle due, si torna al Portone conservando
// la destinazione richiesta — stesso meccanismo di assets/js/shared/navigation.js
// (rememberCurrentDestination + ?returnTo=), qui passato al Router invece che a un reload.
export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const navigationService = inject(NavigationService);
  const router = inject(Router);

  const session = await authService.loadAuthSession();
  if (session.authenticated && session.user && authService.isAccessUnlocked(session.user.id)) {
    authService.currentUser.set(session.user);
    authService.adminModeEnabled.set(session.adminModeEnabled === true);
    authService.touchAccessUnlock(session.user.id);
    return true;
  }

  navigationService.rememberCurrentDestination();
  return router.createUrlTree(['/'], { queryParams: { returnTo: state.url } });
};
