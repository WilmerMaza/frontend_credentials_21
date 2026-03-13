/** Modelo compartido para ítems de la lista de personal (tabla y carnet). */
export interface PersonalItem {
  id: string;
  photoUrl?: string;
  nombreCompleto: string;
  sub?: string;
  identificacion: string;
  rango: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  correo: string;
  fechaIngreso: string;
}
