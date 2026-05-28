import { environment } from '../../../environments/environment';

/** Mensaje legible para errores HTTP (incluye status 0 = sin conexión). */
export function getHttpErrorMessage(err: unknown, context?: string): string {
  const status = (err as { status?: number })?.status;
  const api = environment.enap_api;

  if (status === 0) {
    return (
      `No hay conexión con el servidor API (${api}). ` +
      'Inicie el backend (por ejemplo: cd back.escuela && npm run start:dev) y vuelva a intentar.'
    );
  }

  if (status === 404) {
    if (context === 'mail') {
      return (
        'El servidor no expone POST /mail/send-email. ' +
        'Verifique que el backend (back.escuela) esté actualizado y en ejecución.'
      );
    }
    return 'Recurso no encontrado en el servidor.';
  }

  if (status === 401) {
    return 'Sesión inválida o API key incorrecta. Inicie sesión de nuevo y revise environment.apiKey.';
  }

  if (context === 'registration') {
    if (status === 413) {
      return 'La imagen es demasiado grande. Use una foto de menos de 5 MB.';
    }
    if (status === 422) {
      const backendMessage = (err as { error?: { message?: string | string[] } })?.error?.message;
      if (Array.isArray(backendMessage)) return backendMessage.join('\n');
      if (typeof backendMessage === 'string' && backendMessage.trim()) return backendMessage;
      return 'Los datos enviados no son válidos. Revise el formulario e intente de nuevo.';
    }
  }

  const backendMessage = (err as { error?: { message?: string | string[] } })?.error?.message;
  if (Array.isArray(backendMessage)) {
    return backendMessage.join('\n');
  }
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  if (context === 'mail') {
    return 'No se pudo enviar el correo. Intente de nuevo.';
  }
  if (context === 'registration') {
    return 'No se pudo completar el registro. Intente de nuevo.';
  }
  return 'Ocurrió un error de comunicación con el servidor.';
}
