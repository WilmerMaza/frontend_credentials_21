import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnapApi } from './enap.api';
import type { CredentialTypeApiResponse } from '../models/credential-type.model';

@Injectable({ providedIn: 'root' })
export class CredentialTypeService {
  constructor(private readonly api: EnapApi) {}

  list(): Observable<CredentialTypeApiResponse[]> {
    return this.api.get<CredentialTypeApiResponse[]>('/credential-types');
  }

  getByCode(code: string): Observable<CredentialTypeApiResponse> {
    return this.api.get<CredentialTypeApiResponse>(
      `/credential-types/${encodeURIComponent(code)}`,
    );
  }
}
