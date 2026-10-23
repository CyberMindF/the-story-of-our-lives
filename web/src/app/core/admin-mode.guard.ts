import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Le pagine di gestione non devono comparire neppure all'account admin quando sta usando
// il sito in modalità normale. I controlli backend restano comunque la barriera effettiva.
export const adminModeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin() && authService.adminModeEnabled()) {
    return true;
  }

  return router.createUrlTree(['/tavolo-da-gioco/carte']);
};
