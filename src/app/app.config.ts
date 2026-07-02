import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { routes } from './app.routes';
import { SpanishDateAdapter } from './shared/adapters/spanish-date.adapter';
import { ES_DATE_FORMATS } from './shared/constants/date-formats';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { csrfInterceptor } from './core/interceptors/csrf.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { AuthService } from './core/services/auth';
import { CsrfService } from './core/services/csrf.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        csrfInterceptor,
        loadingInterceptor,
        refreshInterceptor,
      ]),
    ),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const csrf = inject(CsrfService);

      return firstValueFrom(
        forkJoin([
          csrf.loadToken().pipe(catchError(() => of(null))),
          auth.me().pipe(catchError(() => of(null))),
        ]),
      );
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: SpanishDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: ES_DATE_FORMATS },
  ],
};
