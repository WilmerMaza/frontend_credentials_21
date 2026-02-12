import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutLoadingService {
  readonly loading = signal(false);

  setLoading(value: boolean): void {
    this.loading.set(value);
  }
}
