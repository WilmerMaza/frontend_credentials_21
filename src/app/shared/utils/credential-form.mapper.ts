import type { CredentialApiResponse } from '../../features/personal-registrado/models/personal-item.model';
type IdType = 'cc' | 'ti' | 'ce' | 'pasaporte';

export interface RegistrationFormValues {
  type: string;
  common: {
    firstName: string;
    lastName: string;
    idType: IdType | '';
    idNumber: string;
    birthDate: Date | null;
    validUntil: Date | null;
    institutionalEmail: string;
    phone?: string;
  };
  details: Record<string, unknown>;
}

function normalizeDetails(raw: CredentialApiResponse['metadata']): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeIdType(value: unknown): IdType | '' {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'cc' || normalized === 'ti' || normalized === 'ce' || normalized === 'pasaporte') {
    return normalized;
  }
  return '';
}

export interface CredentialEditContext {
  id: string;
  credentialTypeCode: string;
  credentialTypeName: string;
  idType: string;
  idNumber: string;
  createdAtLabel: string;
  status: string;
}

export interface CredentialEditFormValues {
  status: string;
  common: {
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    validUntil: Date | null;
    institutionalEmail: string;
    phone?: string;
  };
  details: Record<string, unknown>;
}

function formatDisplayDate(value: unknown): string {
  const date = parseDate(value);
  if (!date) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeStatus(value: unknown): string {
  return String(value ?? 'ACTIVE').trim().toUpperCase() || 'ACTIVE';
}

/** Mapea una credencial del API al formulario de edición. */
export function mapCredentialToEditForm(credential: CredentialApiResponse): {
  context: CredentialEditContext;
  form: CredentialEditFormValues;
} {
  const metadata = normalizeDetails(credential.metadata);
  const phone = String(metadata['phone'] ?? '').trim();
  const idType = normalizeIdType(credential.typeIdentity);

  return {
    context: {
      id: credential.id,
      credentialTypeCode: String(credential.credentialTypeCode ?? 'militar'),
      credentialTypeName: String(credential.credentialTypeName ?? credential.credentialTypeCode ?? ''),
      idType: idType || String(credential.typeIdentity ?? '').toUpperCase(),
      idNumber: String(credential.identityNumber ?? '').trim(),
      createdAtLabel: formatDisplayDate(credential.createdAt),
      status: normalizeStatus(credential.status),
    },
    form: {
      status: normalizeStatus(credential.status),
      common: {
        firstName: String(credential.firstName ?? '').trim(),
        lastName: String(credential.lastName ?? '').trim(),
        birthDate: parseDate(credential.birthDate),
        validUntil: parseDate(credential.expirationDate),
        institutionalEmail: String(credential.institutionalEmail ?? '').trim(),
        phone: phone || undefined,
      },
      details: { ...metadata },
    },
  };
}

/** Mapea una credencial del API al estado del formulario de registro. */
export function mapCredentialToRegistrationForm(
  credential: CredentialApiResponse,
): RegistrationFormValues {
  const metadata = normalizeDetails(credential.metadata);
  const phone = String(metadata['phone'] ?? '').trim();

  return {
    type: String(credential.credentialTypeCode ?? 'militar'),
    common: {
      firstName: String(credential.firstName ?? '').trim(),
      lastName: String(credential.lastName ?? '').trim(),
      idType: normalizeIdType(credential.typeIdentity),
      idNumber: String(credential.identityNumber ?? '').trim(),
      birthDate: parseDate(credential.birthDate),
      validUntil: parseDate(credential.expirationDate),
      institutionalEmail: String(credential.institutionalEmail ?? '').trim(),
      phone: phone || undefined,
    },
    details: { ...metadata },
  };
}
