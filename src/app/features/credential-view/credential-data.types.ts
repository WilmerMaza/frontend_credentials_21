/**
 * Estructura de credencial digital según el tipo de registro.
 * Mantiene datos comunes y expone campos dinámicos para no forzar
 * registros civiles o inter-escuelas dentro de una forma militar.
 */
export interface CredentialOrg {
  nombre: string;
  pais: string;
  dependencia: string;
  logoUrl?: string;
}

export interface CredentialDoc {
  numeroOficial: string;
  titulo: string;
  subtitulo: string;
}

export interface CredentialPersona {
  nombreCompleto: string;
  identificacion: string;
  fechaNacimiento?: string;
  tipoSangre?: string;
  fotoUrl?: string;
}

export interface CredentialTypeInfo {
  codigo: string;
  nombre: string;
  variante: 'militar' | 'inter-escuelas' | 'civil';
}

export interface CredentialField {
  label: string;
  value: string;
}

export interface CredentialContacto {
  correo: string;
  telefono?: string;
}

export interface CredentialVerificacion {
  qrData: string;
  sha256: string;
  verificado: boolean;
}

export interface CredentialVigencia {
  emision: string;
  validoHasta: string;
}

export interface CredentialData {
  org: CredentialOrg;
  doc: CredentialDoc;
  persona: CredentialPersona;
  tipoRegistro: CredentialTypeInfo;
  resumen: string;
  estado: string;
  camposPrincipales: CredentialField[];
  camposSecundarios: CredentialField[];
  contacto: CredentialContacto;
  verificacion: CredentialVerificacion;
  vigencia: CredentialVigencia;
}
