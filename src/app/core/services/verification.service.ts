import { HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnapApi } from './enap.api';
import { BYPASS_SPINNER } from '../interceptors/loading.interceptor';
import type { PublicVerificationResponse } from '../../features/verification/verification.model';

@Injectable({ providedIn: 'root' })
export class VerificationService {
  constructor(private readonly api: EnapApi) {}

  verify(identityNumber: string, type: string): Observable<PublicVerificationResponse> {
    const params = new HttpParams()
      .set('identity', identityNumber.trim())
      .set('type', type.trim());

    const context = new HttpContext().set(BYPASS_SPINNER, true);

    return this.api.get<PublicVerificationResponse>('/verify', params, context);
  }
}
