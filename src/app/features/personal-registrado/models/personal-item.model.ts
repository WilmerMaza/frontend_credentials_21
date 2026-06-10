export type CredentialTypeCode = 'militar' | 'civil' | 'inter-escuelas' | string;

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
  estado: 'activo' | 'inactivo' | 'pendiente';
  correo: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  telefono?: string;
  tipoIdentificacion?: string;
}

function mapApiStatus(status?: string | null): PersonalItem['estado'] {
  switch ((status ?? 'ACTIVE').toUpperCase()) {
    case 'PENDING':
      return 'pendiente';
    case 'EXPIRED':
    case 'REVOKED':
    case 'SUSPENDED':
      return 'inactivo';
    default:
      return 'activo';
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
  const tipoRegistroNombre =
    nonEmptyString(c.credentialTypeName) ?? getCredentialTypeLabel(tipoRegistroCodigo);
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
    estado: mapApiStatus(c.status),
    correo: c.institutionalEmail,
    fechaNacimiento,
    fechaIngreso: formatDate(new Date(c.createdAt)),
    telefono: nonEmptyString(c.phone),
    tipoIdentificacion: nonEmptyString(c.typeIdentity),
  };
}

export function getCredentialTypeLabel(typeCode: string): string {
  const normalized = normalizeTypeCode(typeCode);
  if (normalized === 'inter-escuelas') return 'Inter-escuelas';
  if (normalized === 'civil') return 'Personal Civil';
  return 'Personal Militar';
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

function formatOptionalDate(value: unknown): string | undefined {
  const raw = nonEmptyString(value);
  if (!raw) return undefined;

  return formatDate(new Date(raw));
}

function formatDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
