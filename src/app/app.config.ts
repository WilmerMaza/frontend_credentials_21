import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { routes } from './app.routes';
import { SpanishDateAdapter } from './shared/adapters/spanish-date.adapter';
import { ES_DATE_FORMATS } from './shared/constants/date-formats';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,   // muestra el spinner global
        refreshInterceptor,   // maneja 401 → refresh → reintento automático
      ])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: DateAdapter, useClass: SpanishDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: ES_DATE_FORMATS },
  ],
};
