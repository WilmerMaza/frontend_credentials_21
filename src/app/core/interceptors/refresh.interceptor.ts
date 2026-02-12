import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, filter, ReplaySubject, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './../services/auth';
import { EnapApi } from '../services/enap.api';


let refreshing : boolean;
// cuando hay un refresh en curso, los demás esperan a que emita "ok"
let refreshDone$: ReplaySubject<boolean> | null = null;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  // No interceptar el propio refresh/login/logout
  if (req.url.includes('/login/refresh') || req.url.includes('/login') || req.url.includes('/logout')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      // Si ya hay un refresh en curso: espera a que termine y reintenta
      if (refreshing && refreshDone$) {
        return refreshDone$.pipe(
          filter(Boolean),   // solo cuando emita "true"
          take(1),
          switchMap(() => next(req.clone())) // reintenta la petición original
        );
      }

      // Iniciar ciclo de refresh
      refreshing = true;
      refreshDone$ = new ReplaySubject<boolean>(1);

      const api = inject(EnapApi);
      const auth = inject(AuthService);

      return api.post<void>('/login/refresh', {}).pipe(
        switchMap(() => {
          // éxito → avisar a los que esperaban y reintentar la original
          refreshing = false;
          refreshDone$?.next(true);
          refreshDone$?.complete();
          refreshDone$ = null;
          return next(req.clone());
        }),

        catchError((refreshErr: Error)  => {
          // falló el refresh → limpiar estado y propagar error
          refreshing = false;
          refreshDone$?.error(refreshErr);
          refreshDone$ = null;

          // opcional: cerrar sesión (borra cookies en el backend)
          auth.logout().subscribe({
            error: () => { /* silenciar errores de logout */ }
          });

          return throwError(() => refreshErr);
        })
      );
    })
  );
};
