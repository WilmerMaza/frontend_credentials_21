import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EnapApi } from './enap.api';
import type { CredentialApiResponse } from '../../features/personal-registrado/models/personal-item.model';

export const REGISTRATION_DRAFT_KEY = 'registration_draft';
export const REGISTRATION_DRAFT_CREDENTIAL_ID_KEY = 'registration_draft_credential_id';
export const REGISTRATION_FORM_AUTOSAVE_KEY = 'registration_form_autosave';

/** Caché local del formulario en progreso (sobrevive a recargas de página en la misma pestaña). */
export interface RegistrationFormAutosave {
  type: string;
  common: {
    firstName: string;
    lastName: string;
    idType: string;
    idNumber: string;
    birthDate: string | null;
    validUntil: string | null;
    institutionalEmail: string;
    phone?: string;
  };
  details: Record<string, unknown>;
  photoDataUrl?: string;
  emailAvailability?: 'available' | 'duplicate';
  identityAvailability?: 'available' | 'duplicate';
  savedAt: string;
}

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

  static getDraftCredentialId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REGISTRATION_DRAFT_CREDENTIAL_ID_KEY);
  }

  static setDraftCredentialId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REGISTRATION_DRAFT_CREDENTIAL_ID_KEY, id);
  }

  static clearLegacyDraftCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REGISTRATION_DRAFT_KEY);
  }

  static clearDraftStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REGISTRATION_DRAFT_CREDENTIAL_ID_KEY);
    localStorage.removeItem(REGISTRATION_DRAFT_KEY);
    RegistrationService.clearFormAutosave();
  }

  static saveFormAutosave(cache: RegistrationFormAutosave): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(REGISTRATION_FORM_AUTOSAVE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('No se pudo guardar el progreso del formulario', error);
    }
  }

  static loadFormAutosave(): RegistrationFormAutosave | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(REGISTRATION_FORM_AUTOSAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as RegistrationFormAutosave;
    } catch {
      return null;
    }
  }

  static clearFormAutosave(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(REGISTRATION_FORM_AUTOSAVE_KEY);
  }

  /** GET /credentials/:id */
  getCredential(id: string): Observable<CredentialApiResponse> {
    return this.enap.get<CredentialApiResponse>(`/credentials/${encodeURIComponent(id)}`);
  }

  /**
   * Crea o actualiza un borrador en el API con status PENDING.
   * Reutiliza el id guardado en localStorage para evitar duplicados.
   */
  saveDraft(payload: RegistrationPayload, photo?: File): Observable<CredentialApiResponse> {
    const existingId = RegistrationService.getDraftCredentialId();
    const draftPayload: UpdateCredentialPayload = { ...payload, status: 'PENDING' };

    if (existingId) {
      return this.updateRegistration(existingId, draftPayload, photo);
    }

    const formData = this.buildFormData(draftPayload, photo);
    formData.append('status', 'PENDING');
    return this.enap.post<CredentialApiResponse>('/credentials', formData).pipe(
      tap((created) => RegistrationService.setDraftCredentialId(created.id)),
    );
  }

  /**
   * POST /credentials o PATCH /credentials/:id (multipart/form-data)
   * Si existe un borrador previo, activa la credencial con PATCH status=ACTIVE.
   */
  submitRegistration(
    payload: RegistrationPayload,
    photo?: File,
    existingId?: string,
  ): Observable<CredentialApiResponse> {
    if (existingId) {
      return this.updateRegistration(existingId, { ...payload, status: 'ACTIVE' }, photo);
    }

    const formData = this.buildFormData(payload, photo);
    formData.append('status', 'ACTIVE');
    return this.enap.post<CredentialApiResponse>('/credentials', formData);
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
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof value === 'string') return value;
    return '';
  }
}
