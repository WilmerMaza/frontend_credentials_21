import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { AuthService } from '../services/auth';

/**
 * Protege rutas privadas. Sin sesión válida → /login.
 */
export const JwtGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const loginTree = router.createUrlTree(['/login']);

  if (auth.isAuthenticated()) {
    return true;
  }

  const ok = await firstValueFrom(
    auth.me().pipe(
      map(() => true),
      catchError(() => of(false)),
    ),
  );

  return ok ? true : loginTree;
};
