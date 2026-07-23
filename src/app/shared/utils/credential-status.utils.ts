export type CredentialStatusCode =
  | 'ACTIVE'
  | 'PENDING'
  | 'EXPIRED'
  | 'TRANSFERRED';

export type CredentialStatusBadgeClass = 'ok' | 'warn' | 'off' | 'info';

/** Etiquetas canónicas de estado: siempre MAYÚSCULAS. */
export const CREDENTIAL_STATUS_OPTIONS: Array<{
  value: CredentialStatusCode;
  label: string;
}> = [
  { value: 'ACTIVE', label: 'ACTIVO' },
  { value: 'PENDING', label: 'PENDIENTE' },
  { value: 'EXPIRED', label: 'EXPIRADO' },
  { value: 'TRANSFERRED', label: 'TRASLADADO' },
];

export function normalizeCredentialStatus(status?: string | null): CredentialStatusCode {
  const normalized = String(status ?? 'ACTIVE').trim().toUpperCase();

  switch (normalized) {
    case 'PENDING':
    case 'PENDIENTE':
      return 'PENDING';
    case 'EXPIRED':
    case 'EXPIRADO':
    case 'INACTIVE':
    case 'INACTIVO':
      return 'EXPIRED';
    case 'TRANSFERRED':
    case 'TRASLADADO':
      return 'TRANSFERRED';
    case 'ACTIVE':
    case 'ACTIVO':
      return 'ACTIVE';
    default:
      return 'ACTIVE';
  }
}

export function getCredentialStatusLabel(status?: string | null): string {
  const normalized = normalizeCredentialStatus(status);
  return (
    CREDENTIAL_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ??
    normalized.toUpperCase()
  );
}

export function getCredentialStatusBadgeClass(
  status?: string | null,
): CredentialStatusBadgeClass {
  switch (normalizeCredentialStatus(status)) {
    case 'ACTIVE':
      return 'ok';
    case 'PENDING':
      return 'warn';
    case 'EXPIRED':
      return 'off';
    case 'TRANSFERRED':
      return 'info';
  }
}

export function getIdTypeLabel(idType: string): string {
  switch (idType.trim().toLowerCase()) {
    case 'cc':
      return 'Cédula de ciudadanía (CC)';
    case 'ti':
      return 'Tarjeta de identidad (TI)';
    case 'ce':
      return 'Cédula de extranjería (CE)';
    case 'pasaporte':
      return 'Pasaporte';
    default:
      return idType || '—';
  }
}
