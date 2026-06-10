import { HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { EnapApi } from './enap.api';
import { BYPASS_SPINNER } from '../interceptors/loading.interceptor';

export interface ValidationExistsResponse {
  exists: boolean;
}

@Injectable({ providedIn: 'root' })
export class ValidationService {
  constructor(private readonly api: EnapApi) {}

  /**
   * GET /validations/email?email={email}
   * Indica si el correo institucional ya está registrado.
   */
  checkEmailExists(email: string): Observable<boolean> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return of(false);

    const params = new HttpParams().set('email', normalized);
    const context = new HttpContext().set(BYPASS_SPINNER, true);

    return this.api
      .get<ValidationExistsResponse>('/validations/email', params, context)
      .pipe(
        map((response) => !!response.exists),
        catchError(() => of(false)),
      );
  }

  /**
   * GET /validations/identity?identityNumber={identityNumber}
   * Indica si el número de identificación (CC, TI, etc.) ya está registrado.
   */
  checkIdentityExists(identityNumber: string): Observable<boolean> {
    const normalized = identityNumber.trim();
    if (!normalized) return of(false);

    const params = new HttpParams().set('identityNumber', normalized);
    const context = new HttpContext().set(BYPASS_SPINNER, true);

    return this.api
      .get<ValidationExistsResponse>('/validations/identity', params, context)
      .pipe(
        map((response) => !!response.exists),
        catchError(() => of(false)),
      );
  }
}
