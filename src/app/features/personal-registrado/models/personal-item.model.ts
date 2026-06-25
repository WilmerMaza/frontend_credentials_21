import {
  parseCredentialDate,
  resolveEffectiveCredentialStatus,
} from '../../../shared/utils/credential-expiration.utils';
import type { CredentialStatusCode } from '../../../shared/utils/credential-status.utils';

export type CredentialTypeCode = 'militar' | 'civil' | 'cadetes' | 'inter-escuelas' | string;

export type CredentialDetails = Record<string, unknown>;

/** Ítem crudo del API GET /credentials */
export interface CredentialApiResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  identityNumber: string;
  typeIdentity?: string | null;
  unit?: string | null;
  birthDate?: string | null;
  institutionalEmail: string;
  imagePath?: string | null;
  phone?: string | null;
  credentialTypeCode?: CredentialTypeCode | null;
  credentialTypeName?: string | null;
  details?: CredentialDetails | string | null;
  metadata?: CredentialDetails | null;
  status?: string | null;
  expirationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialStatusSummary {
  activas: number;
  inactivas: number;
  pendientes: number;
  expiradas?: number;
}

/** Respuesta paginada del API GET /credentials */
export interface PaginatedCredentialsResponse {
  data: CredentialApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: CredentialStatusSummary;
}

/** Modelo interno usado por la tabla y el carnet. */
export interface PersonalItem {
  id: string;
  photoUrl?: string;
  nombreCompleto: string;
  sub?: string;
  identificacion: string;
  rango: string;
  unidad: string;
  tipoRegistroCodigo: CredentialTypeCode;
  tipoRegistroNombre: string;
  detallesRegistro: CredentialDetails;
  estado: CredentialStatusCode;
  correo: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  validoHasta: string;
  telefono?: string;
  tipoIdentificacion?: string;
}

export function deriveValidoHasta(fechaIngreso?: string): string {
  if (!fechaIngreso) return '20/11/2030';
  try {
    const parts = fechaIngreso.split(/[/-]/).map(Number);
    if (parts.length < 3) return '20/11/2030';
    let d: number, m: number, y: number;
    if (parts[0]! > 31) {
      [y, m, d] = [parts[0]!, parts[1]! || 1, parts[2]! || 1];
    } else {
      [d, m, y] = [parts[0]! || 1, parts[1]! || 1, parts[2]!];
    }
    const date = new Date(y, m - 1, d);
    date.setFullYear(date.getFullYear() + 5);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '20/11/2030';
  }
}

/** Convierte la respuesta del API al modelo interno. */
export function mapCredentialToPersonalItem(c: CredentialApiResponse): PersonalItem {
  const metadata = normalizeDetails(c.metadata);
  const detallesRegistro = {
    ...normalizeDetails(c.details),
    ...metadata,
  };
  const tipoRegistroCodigo = String(c.credentialTypeCode ?? 'militar');
  const tipoRegistroNombre = resolveCredentialDisplayName(
    tipoRegistroCodigo,
    c.credentialTypeName,
  );
  const rango = pickFirstString(
    metadata['grades'],
    metadata['rank'],
    detallesRegistro['grades'],
    detallesRegistro['rank'],
  );
  const unidad = pickFirstString(
    metadata['unit'],
    metadata['force'],
    detallesRegistro['unit'],
    detallesRegistro['force'],
  );
  const fechaNacimiento = formatOptionalDate(c.birthDate);
  const fechaIngreso = formatDate(new Date(c.createdAt));
  const expirationReference = resolveExpirationReference(c.expirationDate, detallesRegistro);
  const validoHasta =
    formatOptionalDate(expirationReference) ?? deriveValidoHasta(fechaIngreso);
  const estadoReference = expirationReference ?? validoHasta;

  return {
    id: c.id,
    photoUrl: c.imagePath || undefined,
    nombreCompleto:
      c.fullName?.trim() ||
      [c.firstName, c.lastName].filter(Boolean).join(' ').trim() ||
      'Sin nombre',
    identificacion: c.identityNumber,
    rango: rango ?? tipoRegistroNombre,
    unidad: unidad ?? '',
    tipoRegistroCodigo,
    tipoRegistroNombre,
    detallesRegistro,
    estado: resolveEffectiveCredentialStatus(c.status, estadoReference),
    correo: c.institutionalEmail,
    fechaNacimiento,
    fechaIngreso,
    validoHasta,
    telefono: nonEmptyString(c.phone),
    tipoIdentificacion: nonEmptyString(c.typeIdentity),
  };
}

export function getCredentialTypeLabel(typeCode: string): string {
  const normalized = normalizeTypeCode(typeCode);
  if (normalized === 'civil') return 'Personal Civil';
  if (normalized === 'militar') return 'Personal Militar';
  return typeCode;
}

export function resolveCredentialDisplayName(
  typeCode: string,
  apiName?: string | null,
): string {
  return nonEmptyString(apiName) ?? getCredentialTypeLabel(typeCode);
}

export function normalizeTypeCode(typeCode: string): string {
  return typeCode.trim().toLowerCase().replace(/_/g, '-');
}

export function getCredentialDetailValue(
  details: CredentialDetails,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const direct = nonEmptyString(details[key]);
    if (direct) return direct;

    const lowerKey = key.toLowerCase();
    const matchingKey = Object.keys(details).find(
      (candidate) => candidate.toLowerCase() === lowerKey,
    );
    if (matchingKey) {
      const value = nonEmptyString(details[matchingKey]);
      if (value) return value;
    }
  }

  return undefined;
}

function normalizeDetails(raw: CredentialApiResponse['details'] | CredentialDetails | null | undefined): CredentialDetails {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(raw) ? raw : {};
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = nonEmptyString(value);
    if (normalized) return normalized;
  }

  return undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function isRecord(value: unknown): value is CredentialDetails {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveExpirationReference(
  expirationDate: string | null | undefined,
  details: CredentialDetails,
): string | undefined {
  return (
    nonEmptyString(expirationDate) ??
    nonEmptyString(details['validUntil']) ??
    nonEmptyString(details['valid_until'])
  );
}

function formatOptionalDate(value: unknown): string | undefined {
  const date = parseCredentialDate(value);
  if (!date) return undefined;
  return formatDate(date);
}

function formatDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
