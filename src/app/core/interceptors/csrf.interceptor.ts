import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from '../services/csrf.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const CSRF_SKIP_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/csrf'];

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next(req);
  }

  if (CSRF_SKIP_URLS.some((fragment) => req.url.includes(fragment))) {
    return next(req);
  }

  const csrf = inject(CsrfService);
  const token = csrf.getToken();
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-CSRF-Token': token,
      },
    }),
  );
};
