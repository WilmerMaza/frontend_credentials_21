import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { EnapApi } from './enap.api';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<any | null>(null);

  constructor(private enapApi: EnapApi, private router: Router) {}

  getUser(): any | null {
    return this.user();
  }

  setUser(u: any): void {
    this.user.set(u);
  }

  clear(): void {
    this.user.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.user();
  }

  loadSession(): Observable<any> {
    return this.enapApi
      .get<any>('/login/me')
      .pipe(tap((res: any) => this.setUser(res)));
  }

  logout(): Observable<void> {
    return this.enapApi.post<void>(`/login/logout`, {}).pipe(
      tap(() => {
        this.clear(); // ✅ resetea usuario
        this.router.navigate(['/login']);
      })
    );
  }
}
