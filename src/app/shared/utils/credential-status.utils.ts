export type CredentialStatusCode =
  | 'ACTIVE'
  | 'PENDING'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED';

export const CREDENTIAL_STATUS_OPTIONS: Array<{
  value: CredentialStatusCode;
  label: string;
}> = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'REVOKED', label: 'Revocado' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

export function getCredentialStatusLabel(status?: string | null): string {
  const normalized = String(status ?? 'ACTIVE').trim().toUpperCase();
  return CREDENTIAL_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ?? normalized;
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
