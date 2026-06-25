import {
  normalizeCredentialStatus,
  type CredentialStatusCode,
} from './credential-status.utils';

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/** Parsea fechas ISO, Date o DD/MM/YYYY usadas en vigencia. */
export function parseCredentialDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True si expirationDate es anterior al inicio del día de referencia (comparación por día calendario). */
export function isCredentialExpired(
  expirationDate?: unknown,
  referenceDate = new Date(),
): boolean {
  const expiration = parseCredentialDate(expirationDate);
  if (!expiration) return false;

  return startOfDay(expiration).getTime() < startOfDay(referenceDate).getTime();
}

/**
 * Estado efectivo de lectura: eleva ACTIVE → EXPIRED si la vigencia ya pasó.
 * No persiste; el backend es la fuente de verdad en BD.
 */
export function resolveEffectiveCredentialStatus(
  status: string | null | undefined,
  expirationDate?: unknown,
  referenceDate = new Date(),
): CredentialStatusCode {
  const normalized = normalizeCredentialStatus(status);
  if (normalized !== 'ACTIVE') return normalized;
  if (isCredentialExpired(expirationDate, referenceDate)) return 'EXPIRED';
  return normalized;
}
