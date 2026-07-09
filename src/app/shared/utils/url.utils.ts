import { environment } from '../../../environments/environment';

/** Imagen local mostrada cuando no hay foto o falla la carga. */
export const DEFAULT_CREDENTIAL_PHOTO = '/images/default-credential.svg';

/** Origen público para enlaces del QR (no la URL del API). */
export function getPublicAppUrl(): string {
  const configured = environment.publicAppUrl?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/**
 * Genera la URL completa de una imagen/archivo, concatenando la URL del backend (API_URL)
 * de forma segura y previniendo problemas de diagonales dobles o vacías.
 */
export function getPhotoUrl(photoPath?: string): string {
  if (!photoPath?.trim()) return '';
  const normalized = photoPath.trim();
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  const apiUrl = environment.enap_api;
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const path = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  return `${baseUrl}/${path}`;
}

/** URL de foto para listados y credencial; usa fallback si no hay ruta. */
export function resolveCredentialPhotoUrl(photoPath?: string | null): string {
  const url = getPhotoUrl(photoPath ?? '');
  return url || DEFAULT_CREDENTIAL_PHOTO;
}

/** Reemplaza la imagen rota (404) por la foto por defecto. */
export function onCredentialPhotoError(event: Event): void {
  const img = event.target as HTMLImageElement | null;
  if (!img || img.dataset['fallbackApplied'] === 'true') return;
  img.dataset['fallbackApplied'] = 'true';
  img.src = DEFAULT_CREDENTIAL_PHOTO;
}

/** Foto pública para la página de verificación (sin JWT). */
export function getPublicVerifyPhotoUrl(filename?: string): string {
  if (!filename?.trim()) return DEFAULT_CREDENTIAL_PHOTO;
  const apiUrl = environment.enap_api;
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  return `${baseUrl}/verify/photo/${encodeURIComponent(filename.trim())}`;
}

/** Foto pública con fallback para verificación. */
export function resolvePublicVerifyPhotoUrl(filename?: string | null): string {
  if (!filename?.trim()) return DEFAULT_CREDENTIAL_PHOTO;
  return getPublicVerifyPhotoUrl(filename);
}
