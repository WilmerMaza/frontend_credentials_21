import { Provider, DestroyRef, inject } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SpinnerService } from '../../shared/services/spinner.service';

export function provideRouterSpinner(): Provider {
  return {
    provide: 'ROUTER_SPINNER_INIT',
    useFactory: () => {
      const router = inject(Router);
      const spinner = inject(SpinnerService);
      const dref = inject(DestroyRef);

      router.events.pipe(takeUntilDestroyed(dref)).subscribe((ev) => {
        if (ev instanceof NavigationStart) spinner.show();
        if (
          ev instanceof NavigationEnd ||
          ev instanceof NavigationCancel ||
          ev instanceof NavigationError
        ) {
          spinner.hide();
        }
      });

      return true; // valor dummy
    },
  };
}
