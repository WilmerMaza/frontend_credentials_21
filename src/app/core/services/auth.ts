import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { EnapApi } from './enap.api';
import { CsrfService } from './csrf.service';

export interface AuthUser {
  id: string;
  email: string;
  personId?: string;
}

export interface AuthSessionSummary {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();

  constructor(
    private api: EnapApi,
    private router: Router,
    private csrf: CsrfService,
  ) {}

  getUser(): AuthUser | null {
    return this._user();
  }

  isAuthenticated(): boolean {
    return !!this._user();
  }

  setUser(u: AuthUser | null): void {
    this._user.set(u);
  }

  clearUser(): void {
    this._user.set(null);
  }

  login(credentials: { email: string; password: string }): Observable<void> {
    return this.api
      .post<{ csrfToken?: string }>('/auth/login', credentials)
      .pipe(
        tap((response) => {
          if (response?.csrfToken) {
            this.csrf.setToken(response.csrfToken);
          }
        }),
        map(() => undefined),
      );
  }

  me(): Observable<AuthUser> {
    return this.api.get<AuthUser>('/auth/me').pipe(tap((user) => this.setUser(user)));
  }

  refresh(): Observable<void> {
    return this.api.post<void>('/auth/refresh', {});
  }

  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {}).pipe(
      tap({
        next: () => {
          this.clearUser();
          this.csrf.setToken(null);
          this.router.navigate(['/login']);
        },
        error: () => {
          this.clearUser();
          this.csrf.setToken(null);
          this.router.navigate(['/login']);
        },
      }),
    );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/change-password', payload).pipe(
      tap(() => {
        this.clearUser();
        this.csrf.setToken(null);
        this.router.navigate(['/login']);
      }),
    );
  }

  getSessions(): Observable<AuthSessionSummary[]> {
    return this.api.get<AuthSessionSummary[]>('/auth/sessions');
  }

  revokeSession(sessionId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  }

  getAdminSessions(userId: string): Observable<AuthSessionSummary[]> {
    return this.api.get<AuthSessionSummary[]>(`/auth/admin/sessions/${userId}`);
  }

  loadSession(): Observable<AuthUser> {
    return this.me();
  }
}
