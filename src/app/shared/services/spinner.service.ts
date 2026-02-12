import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  private _count = signal(0);
  readonly isLoading = computed(() => this._count() > 0);

  private _lastShowAt = 0; // 👈 aquí guardamos la marca de tiempo

  public show(): void {
    this._lastShowAt = Date.now(); // guardamos cuando empezó
    this._count.update((v) => v + 1);
  }

  public hide(): void {
    const minVisible = 1500; // ms mínimos para evitar flicker
    const elapsed = Date.now() - this._lastShowAt;
    const wait = Math.max(0, minVisible - elapsed);

    setTimeout(() => {
      this._count.update((v) => Math.max(0, v - 1));
    }, wait);
  }
}
