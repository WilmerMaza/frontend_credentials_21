import {
  getCredentialDetailValue,
  getCredentialTypeLabel,
  normalizeTypeCode,
  type PersonalItem,
} from '../personal-registrado/models/personal-item.model';
import { getPhotoUrl } from '../../shared/utils/url.utils';
import { normalizeCredentialStatus } from '../../shared/utils/credential-status.utils';
import type { CredentialData } from './credential-data.types';
import type { CredentialPdfData } from './credential-view-pdf.component';

const DEFAULT_LOGO = '/images/ENAP.png';
const DEFAULT_PHOTO = 'https://i.imgur.com/8Km9tLL.png';

type CredentialVariant = CredentialData['tipoRegistro']['variante'];

export type PersonalItemWithExtras = PersonalItem & {
  fechaNacimiento?: string;
  emision?: string;
  validoHasta?: string;
  sha256?: string;
};

export function mapPersonalItemToCredentialData(item: PersonalItemWithExtras): CredentialData {
  const emision = item.emision ?? item.fechaIngreso ?? '20/11/2025';
  const validoHasta = item.validoHasta ?? deriveValidoHasta(item.fechaIngreso);
  const tipoCodigo = normalizeTypeCode(String(item.tipoRegistroCodigo ?? 'militar'));
  const tipoNombre = item.tipoRegistroNombre || getCredentialTypeLabel(tipoCodigo);
  const variante = getCredentialVariant(tipoCodigo);
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';

  return {
    org: {
      nombre: 'FUERZAS ARMADAS',
      pais: 'República de Colombia',
      dependencia: 'Comando General – Departamento de Recursos Humanos',
      logoUrl: DEFAULT_LOGO,
    },
    doc: {
      numeroOficial: item.identificacion,
      titulo: getCredentialTitle(variante),
      subtitulo: `${tipoNombre} - Documento Oficial Certificado`,
    },
    persona: {
      nombreCompleto: item.nombreCompleto,
      identificacion: item.identificacion,
      fechaNacimiento: item.fechaNacimiento,
      tipoSangre: 'O+',
      fotoUrl: item.photoUrl,
    },
    tipoRegistro: {
      codigo: tipoCodigo,
      nombre: tipoNombre,
      variante,
    },
    resumen: getCredentialSummary(variante, item),
    estado: normalizeCredentialStatus(item.estado),
    camposPrincipales: buildPrimaryFields(variante, item),
    camposSecundarios: buildSecondaryFields(variante, item),
    contacto: {
      correo: item.correo,
      telefono: item.telefono,
    },
    verificacion: {
      qrData: `${baseUrl}/verify/${encodeURIComponent(item.identificacion)}?type=${encodeURIComponent(tipoCodigo)}`,
      sha256: item.sha256 ?? 'A3F7C92E...4D8B92E1',
      verificado: true,
    },
    vigencia: {
      emision,
      validoHasta,
    },
  };
}

export function buildCredentialPdfData(
  item: PersonalItemWithExtras,
  resolvedPhotoUrl?: string,
): CredentialPdfData {
  const credential = mapPersonalItemToCredentialData(item);
  const photo =
    resolvedPhotoUrl ??
    (item.photoUrl ? getPhotoUrl(item.photoUrl) : DEFAULT_PHOTO);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(credential.verificacion.qrData)}`;

  return {
    org: credential.org,
    doc: credential.doc,
    persona: credential.persona,
    tipoRegistro: credential.tipoRegistro,
    resumen: credential.resumen,
    estado: credential.estado,
    camposPrincipales: credential.camposPrincipales,
    camposSecundarios: credential.camposSecundarios,
    contacto: credential.contacto,
    verificacion: credential.verificacion,
    vigencia: credential.vigencia,
    photoUrl: photo,
    qrUrl,
  };
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

function getCredentialVariant(typeCode: string): CredentialVariant {
  const normalized = normalizeTypeCode(typeCode);
  if (normalized === 'cadetes' || normalized === 'inter-escuelas' || normalized.includes('inter')) {
    return 'cadetes';
  }
  if (normalized.includes('civil')) return 'civil';
  return 'militar';
}

function getCredentialTitle(variant: CredentialVariant): string {
  if (variant === 'cadetes') return 'CREDENCIAL CADETES';
  if (variant === 'civil') return 'CREDENCIAL PERSONAL CIVIL';
  return 'CREDENCIAL DE IDENTIFICACIÓN';
}

function getCredentialSummary(variant: CredentialVariant, item: PersonalItem): string {
  if (variant === 'cadetes') {
    return (
      getCredentialDetailValue(item.detallesRegistro, 'sport', 'deporte') ??
      item.tipoRegistroNombre
    );
  }

  if (variant === 'civil') return item.tipoRegistroNombre;

  return item.rango || item.tipoRegistroNombre;
}

function buildPrimaryFields(variant: CredentialVariant, item: PersonalItem) {
  const details = item.detallesRegistro;

  if (variant === 'cadetes') {
    return compactFields([
      field('FUERZA', getCredentialDetailValue(details, 'force', 'fuerza') ?? item.unidad),
      field('DEPORTE', getCredentialDetailValue(details, 'sport', 'deporte')),
      field('CURSO / AÑO', formatCourse(getCredentialDetailValue(details, 'course', 'curso'))),
      field('FECHA DE NACIMIENTO', item.fechaNacimiento),
    ]);
  }

  if (variant === 'civil') {
    return compactFields([
      field('TIPO DE IDENTIFICACIÓN', item.tipoIdentificacion),
      field('NÚMERO DE IDENTIFICACIÓN', item.identificacion),
      field('FECHA DE NACIMIENTO', item.fechaNacimiento),
      field('TELÉFONO', item.telefono),
    ]);
  }

  return compactFields([
    field('RANGO', item.rango),
    field('FUERZA', getCredentialDetailValue(details, 'force', 'fuerza')),
    field('UNIDAD', item.unidad),
    field('FECHA DE INGRESO', item.fechaIngreso),
    field('AÑOS DE SERVICIO', String(calcAniosServicio(item.fechaIngreso))),
  ]);
}

function buildSecondaryFields(variant: CredentialVariant, item: PersonalItem) {
  const fields = [field('CORREO INSTITUCIONAL', item.correo)];

  if (variant !== 'civil') {
    fields.push(field('IDENTIFICACIÓN', item.identificacion));
  }

  return compactFields(fields);
}

function field(label: string, value?: string) {
  return value ? { label, value: humanizeValue(value) } : null;
}

function compactFields(fields: Array<{ label: string; value: string } | null>) {
  return fields.filter((item): item is { label: string; value: string } => item != null);
}

function humanizeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return trimmed;

  return trimmed
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCourse(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return `${value} año`;
  return value;
}

function calcAniosServicio(fechaIngreso: string): number {
  try {
    const parts = fechaIngreso.split(/[/-]/).map(Number);
    if (parts.length < 3) return 0;
    let d: number, m: number, y: number;
    if (parts[0]! > 31) {
      [y, m, d] = [parts[0]!, parts[1]! || 1, parts[2]! || 1];
    } else {
      [d, m, y] = [parts[0]! || 1, parts[1]! || 1, parts[2]!];
    }
    const ingreso = new Date(y, m - 1, d);
    const hoy = new Date();
    return Math.max(
      0,
      Math.floor((hoy.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    );
  } catch {
    return 0;
  }
}
