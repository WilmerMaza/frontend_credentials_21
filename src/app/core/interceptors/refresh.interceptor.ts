import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  filter,
  finalize,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../services/auth';

let refreshInFlight$: Observable<boolean> | null = null;

/**
 * Ante 401: intenta POST /auth/refresh y reintenta la petición.
 * Sin sesión (refresh también 401): propaga el error para que el JwtGuard mande a /login.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() solo es seguro en el cuerpo síncrono del interceptor
  const auth = inject(AuthService);

  const isAuthUrl =
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/csrf');

  const isPublicVerifyUrl = req.url.includes('/verify');

  if (isAuthUrl || isPublicVerifyUrl) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = auth.refresh().pipe(
          map(() => true),
          catchError((refreshErr: unknown) => {
            if (auth.isAuthenticated()) {
              auth.logout().subscribe({ error: () => {} });
            } else {
              auth.clearUser();
            }
            return throwError(() => refreshErr);
          }),
          finalize(() => {
            refreshInFlight$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refreshInFlight$.pipe(
        filter(Boolean),
        take(1),
        switchMap(() => next(req.clone())),
      );
    }),
  );
};
