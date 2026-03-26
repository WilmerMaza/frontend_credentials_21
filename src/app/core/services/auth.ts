import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { EnapApi } from './enap.api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Estado del usuario autenticado (null = sin sesión) */
  private readonly _user = signal<any | null>(null);

  readonly user = this._user.asReadonly();

  constructor(
    private api: EnapApi,
    private router: Router,
  ) {}

  // ─── Getters de conveniencia ─────────────────────────────────────────────────

  getUser(): any | null {
    return this._user();
  }

  isAuthenticated(): boolean {
    return !!this._user();
  }

  // ─── Mutaciones de estado ────────────────────────────────────────────────────

  setUser(u: any): void {
    this._user.set(u);
  }

  clearUser(): void {
    this._user.set(null);
  }

  // ─── API calls ───────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * El backend setea la cookie httpOnly con el access-token y refresh-token.
   * No devuelve el usuario; tras el login llamamos a `me()` para hidratar el estado.
   */
  login(credentials: { email: string; password: string }): Observable<void> {
    return this.api.post<void>('/auth/login', credentials);
  }

  /**
   * GET /auth/me
   * Obtiene el perfil del usuario autenticado a partir de la cookie httpOnly.
   * Se usa al arranque de la app y después del login.
   */
  me(): Observable<any> {
    return this.api.get<any>('/auth/me').pipe(tap((user) => this.setUser(user)));
  }

  /**
   * POST /auth/refresh
   * Renueva el access-token usando el refresh-token (httpOnly cookie).
   * Lo llama el refreshInterceptor automáticamente al recibir un 401.
   */
  refresh(): Observable<void> {
    return this.api.post<void>('/auth/refresh', {});
  }

  /**
   * POST /auth/logout
   * Invalida la sesión en el backend y limpia el estado local.
   * Redirige a /login.
   */
  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {}).pipe(
      tap({
        next: () => {
          this.clearUser();
          this.router.navigate(['/login']);
        },
        error: () => {
          // Aunque falle el backend, limpiar estado local y redirigir
          this.clearUser();
          this.router.navigate(['/login']);
        },
      }),
    );
  }

  /**
   * @deprecated Usa `me()` directamente.
   * Mantenido por compatibilidad con código existente.
   */
  loadSession(): Observable<any> {
    return this.me();
  }
}
