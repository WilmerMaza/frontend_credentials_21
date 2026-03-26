/** Respuesta cruda del API GET /credentials */
export interface CredentialApiResponse {
  id: string;
  fullName: string;
  rank: string;
  identityNumber: string;
  unit: string;
  birthDate: string;
  institutionalEmail: string;
  imagePath: string;
  createdAt: string;
  updatedAt: string;
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
  estado: 'activo' | 'inactivo' | 'pendiente';
  correo: string;
  fechaIngreso: string;
}

/** Convierte la respuesta del API al modelo interno. */
export function mapCredentialToPersonalItem(c: CredentialApiResponse): PersonalItem {
  return {
    id:             c.id,
    photoUrl:       c.imagePath || undefined,
    nombreCompleto: c.fullName,
    identificacion: c.identityNumber,
    rango:          c.rank,
    unidad:         c.unit,
    estado:         'activo',  // el API no devuelve estado; se asume activo
    correo:         c.institutionalEmail,
    fechaIngreso:   formatDate(new Date(c.createdAt)),
  };
}

function formatDate(d: Date): string {
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}
