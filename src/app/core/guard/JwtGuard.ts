import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { AuthService } from '../services/auth';
import { rememberReturnUrl } from './return-url';

/**
 * Protege rutas privadas. Sin sesión válida → /login, conservando la URL pedida.
 */
export const JwtGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  const ok = await firstValueFrom(
    auth.me().pipe(
      map(() => true),
      catchError(() => of(false)),
    ),
  );

  if (ok) {
    return true;
  }

  rememberReturnUrl(state.url);
  return router.createUrlTree(['/login']);
};
