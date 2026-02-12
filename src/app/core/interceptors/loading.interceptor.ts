// loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../shared/services/spinner.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(SpinnerService);
  spinner.show();
  return next(req).pipe(finalize(() => spinner.hide()));
};
