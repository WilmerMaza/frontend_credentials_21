import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';


export const JwtGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // si ya hay usuario, pasas
  if (auth.isAuthenticated()) return true;

  try {
    await firstValueFrom(auth.loadSession()); // ← bloquea hasta que /me resuelva
    return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
};
