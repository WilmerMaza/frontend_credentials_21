/**
 * Estructura de credencial militar según el formato oficial.
 * Soporta org, doc, persona, militar, contacto, verificacion, vigencia.
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
  fechaNacimiento: string;
  tipoSangre?: string;
  fotoUrl?: string;
}

export interface CredentialMilitar {
  rango: string;
  unidad: string;
  fechaIngreso: string;
  aniosServicio?: number;
  especialidad?: string;
  estado: string;
}

export interface CredentialContacto {
  correo: string;
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
  militar: CredentialMilitar;
  contacto: CredentialContacto;
  verificacion: CredentialVerificacion;
  vigencia: CredentialVigencia;
}
