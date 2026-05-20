// loading.interceptor.ts
import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../shared/services/spinner.service';

export const BYPASS_SPINNER = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(SpinnerService);
  if (req.context.get(BYPASS_SPINNER)) {
    return next(req);
  }
  spinner.show();
  return next(req).pipe(finalize(() => spinner.hide()));
};

