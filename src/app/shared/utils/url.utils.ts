import { environment } from '../../../environments/environment';

/**
 * Genera la URL completa de una imagen/archivo, concatenando la URL del backend (API_URL)
 * de forma segura y previniendo problemas de diagonales dobles o vacías.
 */
export function getPhotoUrl(photoPath?: string): string {
  if (!photoPath) return '';
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  const apiUrl = environment.enap_api;
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const path = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
  return `${baseUrl}/${path}`;
}

/** Foto pública para la página de verificación (sin JWT). */
export function getPublicVerifyPhotoUrl(filename?: string): string {
  if (!filename) return '';
  const apiUrl = environment.enap_api;
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  return `${baseUrl}/verify/photo/${encodeURIComponent(filename)}`;
}
