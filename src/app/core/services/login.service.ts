import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { AuthService } from './auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(private auth: AuthService) {}

  /**
   * Flujo completo de inicio de sesión:
   * 1. POST /auth/login  → backend setea cookies httpOnly + CSRF
   * 2. GET  /auth/me     → hidrata el AuthService con el usuario
   *
   * El componente solo se suscribe y navega.
   */
  login(credentials: LoginCredentials): Observable<any> {
    return this.auth.login(credentials).pipe(switchMap(() => this.auth.me()));
  }
}
