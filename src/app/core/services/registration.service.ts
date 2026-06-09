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
    const { common, details } = payload;
    const fd = new FormData();

    // Campos requeridos por el API
    fd.append('fullName',           String(common.fullName ?? ''));
    fd.append('identityNumber',     String(common.idNumber ?? ''));
    fd.append('typeIdentity',       String(common.idType ?? ''));
    fd.append('birthDate',          this.toISODate(common.birthDate));
    fd.append('institutionalEmail', String(common.institutionalEmail ?? ''));
    fd.append('credentialTypeCode', String(payload.type ?? ''));
    fd.append('details', JSON.stringify(details ?? {}));

    // Campos opcionales
    if (common.phone) {
      fd.append('phone', String(common.phone));
    }

    Object.entries(details ?? {}).forEach(([key, value]) => {
      const normalized = this.toFormValue(value);
      if (normalized) {
        fd.append(key, normalized);
      }
    });

    const rank = this.toFormValue(details?.['grades']);
    const unit = this.toFormValue(details?.['unit'] ?? details?.['force']);
    if (rank) fd.append('rank', rank);
    if (unit) fd.append('unit', unit);

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

  private toFormValue(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value).trim();
  }
}
