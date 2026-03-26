import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnapApi } from './enap.api';
import type { CredentialApiResponse } from '../../features/personal-registrado/models/personal-item.model';

/**
 * Payload interno del formulario de registro.
 */
export interface RegistrationPayload {
  type: string;
  common: {
    fullName: string;
    idType: string;
    idNumber: string;
    birthDate: Date | string | null;
    institutionalEmail: string;
    phone?: string;
    [key: string]: unknown;
  };
  details: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private enap: EnapApi) {}

  /**
   * POST /credentials (multipart/form-data)
   *
   * Mapea el formulario al contrato exacto del API:
   *   fullName, identityNumber, typeIdentity, birthDate,
   *   institutionalEmail, credentialTypeCode, image (binary)
   */
  submitRegistration(
    payload: RegistrationPayload,
    photo?: File
  ): Observable<CredentialApiResponse> {
    const formData = this.buildFormData(payload, photo);
    return this.enap.post<CredentialApiResponse>('/credentials', formData);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  private buildFormData(payload: RegistrationPayload, photo?: File): FormData {
    const { common } = payload;
    const fd = new FormData();

    // Campos requeridos por el API
    fd.append('fullName',           String(common.fullName ?? ''));
    fd.append('identityNumber',     String(common.idNumber ?? ''));
    fd.append('typeIdentity',       String(common.idType ?? ''));
    fd.append('birthDate',          this.toISODate(common.birthDate));
    fd.append('institutionalEmail', String(common.institutionalEmail ?? ''));
    fd.append('credentialTypeCode', String(payload.type ?? ''));

    // Campos opcionales
    if (common.phone) {
      fd.append('phone', String(common.phone));
    }

    // Imagen (obligatoria según el API)
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
