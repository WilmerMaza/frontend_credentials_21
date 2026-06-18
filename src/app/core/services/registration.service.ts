import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnapApi } from './enap.api';
import { BYPASS_SPINNER } from '../interceptors/loading.interceptor';
import type { CredentialApiResponse } from '../../features/personal-registrado/models/personal-item.model';

/**
 * Payload interno del formulario de registro.
 */
export interface UpdateCredentialPayload extends RegistrationPayload {
  status?: string;
}

export interface RegistrationPayload {
  type: string;
  common: {
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    birthDate: Date | string | null;
    validUntil: Date | string | null;
    institutionalEmail: string;
    phone?: string;
    [key: string]: unknown;
  };
  details: Record<string, unknown>;
}

/** Nombre completo para uso solo en UI (el backend calcula fullName en BD). */
export function buildFullName(common: RegistrationPayload['common']): string {
  const firstName = String(common.firstName ?? '').trim();
  const lastName = String(common.lastName ?? '').trim();
  return [firstName, lastName].filter(Boolean).join(' ');
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private enap: EnapApi) {}

  /** GET /credentials/:id */
  getCredential(id: string): Observable<CredentialApiResponse> {
    return this.enap.get<CredentialApiResponse>(`/credentials/${encodeURIComponent(id)}`);
  }

  /**
   * POST /credentials (multipart/form-data)
   */
  submitRegistration(
    payload: RegistrationPayload,
    photo?: File,
  ): Observable<CredentialApiResponse> {
    const formData = this.buildFormData(payload, photo);
    const context = new HttpContext().set(BYPASS_SPINNER, true);
    return this.enap.post<CredentialApiResponse>('/credentials', formData, context);
  }

  /**
   * PATCH /credentials/:id (multipart/form-data, imagen opcional)
   */
  updateRegistration(
    id: string,
    payload: UpdateCredentialPayload,
    photo?: File,
  ): Observable<CredentialApiResponse> {
    const formData = this.buildFormData(payload, photo);
    if (payload.status) {
      formData.append('status', payload.status);
    }
    return this.enap.patch<CredentialApiResponse>(
      `/credentials/${encodeURIComponent(id)}`,
      formData,
    );
  }

  private buildFormData(payload: RegistrationPayload, photo?: File): FormData {
    const { common, details } = payload;
    const fd = new FormData();
    const metadata = { ...(details ?? {}) };

    fd.append('firstName', String(common.firstName ?? '').trim());
    fd.append('lastName', String(common.lastName ?? '').trim());
    fd.append('identityNumber', String(common.idNumber ?? '').trim());
    fd.append('typeIdentity', String(common.idType ?? '').trim());
    fd.append('birthDate', this.toISODate(common.birthDate));
    fd.append('institutionalEmail', String(common.institutionalEmail ?? '').trim());
    fd.append('credentialTypeCode', String(payload.type ?? ''));
    fd.append('metadata', JSON.stringify(metadata));
    fd.append(
      'details',
      JSON.stringify({
        ...metadata,
        validUntil: this.toISODate(common.validUntil),
      }),
    );

    const expirationDate = this.toISODate(common.validUntil);
    if (expirationDate) {
      fd.append('expirationDate', expirationDate);
    }

    if (common.phone) {
      fd.append('phone', String(common.phone).trim());
    }

    if (photo) {
      fd.append('image', photo, photo.name);
    }

    return fd;
  }

  private toISODate(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return '';
  }
}
