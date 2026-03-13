import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Payload del formulario de registro para envío al API.
 * Cuando el API esté disponible, sustituir el return por HttpClient.post(...).
 */
export interface RegistrationPayload {
  type: string;
  common: Record<string, unknown>;
  details: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  /**
   * Envía el registro completo al API.
   * Placeholder: aún no hay API disponible. Sustituir por HttpClient.post cuando exista.
   */
  submitRegistration(payload: RegistrationPayload): Observable<void> {
    // TODO: cuando el API esté disponible:
    // return this.http.post<void>('/api/registration', payload);
    return of(undefined);
  }
}
