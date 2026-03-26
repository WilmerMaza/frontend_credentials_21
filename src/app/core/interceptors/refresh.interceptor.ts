import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, filter, ReplaySubject, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
let refreshDone$: ReplaySubject<boolean> | null = null;

/**
 * Interceptor que gestiona el refresco automático del token ante un 401.
 *
 * - Excluye las rutas de auth (login, refresh, logout, me) para evitar bucles.
 * - Si ya hay un refresh en curso, encola la petición fallida para reintentarla
 *   cuando el refresh termine.
 * - Si el refresh falla, llama a logout() y propaga el error.
 */
export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  // Excluir endpoints de auth para evitar bucles infinitos
  const isAuthUrl =
    req.url.includes('/login/refresh') ||
    req.url.includes('/login/logout') ||
    req.url.includes('/login/me') ||
    req.url.includes('/login');

  if (isAuthUrl) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      // ── Hay un refresh en curso: encolar y esperar ──────────────────────────
      if (isRefreshing && refreshDone$) {
        return refreshDone$.pipe(
          filter(Boolean),
          take(1),
          switchMap(() => next(req.clone()))
        );
      }

      // ── Iniciar ciclo de refresh ────────────────────────────────────────────
      isRefreshing = true;
      refreshDone$ = new ReplaySubject<boolean>(1);

      const auth = inject(AuthService);

      return auth.refresh().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshDone$?.next(true);
          refreshDone$?.complete();
          refreshDone$ = null;
          return next(req.clone());
        }),

        catchError((refreshErr: Error) => {
          isRefreshing = false;
          refreshDone$?.error(refreshErr);
          refreshDone$ = null;

          // Sesión inválida: logout y redirigir
          auth.logout().subscribe({ error: () => {} });

          return throwError(() => refreshErr);
        })
      );
    })
  );
};
