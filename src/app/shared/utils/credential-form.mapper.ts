import type { CredentialApiResponse } from '../../features/personal-registrado/models/personal-item.model';
import {
  resolveCredentialDisplayName,
  toCanonicalTypeCode,
} from '../../features/personal-registrado/models/personal-item.model';
import {
  parseCredentialDate,
  resolveEffectiveCredentialStatus,
} from './credential-expiration.utils';
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

function normalizeDetails(
  raw: CredentialApiResponse['details'] | CredentialApiResponse['metadata'],
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function parseDate(value: unknown): Date | null {
  return parseCredentialDate(value);
}

function resolveExpirationRaw(
  credential: CredentialApiResponse,
  metadata: Record<string, unknown>,
): unknown {
  const details = normalizeDetails(credential.details);
  return (
    credential.expirationDate ??
    metadata['validUntil'] ??
    details['validUntil'] ??
    details['valid_until']
  );
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

/** Mapea una credencial del API al formulario de edición. */
export function mapCredentialToEditForm(credential: CredentialApiResponse): {
  context: CredentialEditContext;
  form: CredentialEditFormValues;
} {
  const metadata = normalizeDetails(credential.metadata);
  const phone = String(metadata['phone'] ?? credential.phone ?? '').trim();
  const idType = normalizeIdType(credential.typeIdentity);
  const expirationRaw = resolveExpirationRaw(credential, metadata);
  const effectiveStatus = resolveEffectiveCredentialStatus(
    credential.status,
    expirationRaw,
  );

  return {
    context: {
      id: credential.id,
      credentialTypeCode: toCanonicalTypeCode(
        String(credential.credentialTypeCode ?? 'militar'),
      ),
      credentialTypeName: resolveCredentialDisplayName(
        String(credential.credentialTypeCode ?? 'militar'),
        credential.credentialTypeName,
      ),
      idType: idType || String(credential.typeIdentity ?? '').toUpperCase(),
      idNumber: String(credential.identityNumber ?? '').trim(),
      createdAtLabel: formatDisplayDate(credential.createdAt),
      status: effectiveStatus,
    },
    form: {
      status: effectiveStatus,
      common: {
        firstName: String(credential.firstName ?? '').trim(),
        lastName: String(credential.lastName ?? '').trim(),
        birthDate: parseDate(credential.birthDate),
        validUntil: parseDate(expirationRaw),
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
  const phone = String(metadata['phone'] ?? credential.phone ?? '').trim();

  return {
    type: toCanonicalTypeCode(String(credential.credentialTypeCode ?? 'militar')),
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
