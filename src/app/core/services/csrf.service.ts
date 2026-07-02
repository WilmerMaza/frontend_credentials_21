import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EnapApi } from './enap.api';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly _token = signal<string | null>(null);

  readonly token = this._token.asReadonly();

  constructor(private readonly api: EnapApi) {}

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string | null): void {
    this._token.set(token);
  }

  /** Obtiene un token CSRF del backend y lo guarda en memoria (nunca localStorage). */
  loadToken(): Observable<{ csrfToken: string }> {
    return this.api.get<{ csrfToken: string }>('/auth/csrf').pipe(
      tap((response) => this.setToken(response.csrfToken)),
    );
  }
}
