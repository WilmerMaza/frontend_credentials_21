import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EnapApi } from '../../../core/services/enap.api';
import type { RegistrationPayload } from '../../../core/services/registration.service';
import {
  type CredentialApiResponse,
  type PersonalItem,
  mapCredentialToPersonalItem,
} from '../models/personal-item.model';

@Injectable({ providedIn: 'root' })
export class PersonalListService {
  private readonly _list = signal<PersonalItem[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  /** Señales públicas de solo lectura */
  readonly listSignal  = this._list.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly error       = this._error.asReadonly();

  constructor(private enap: EnapApi) {}

  /**
   * GET /credentials
   * Carga todos los registros desde el API y los mapea al modelo interno.
   */
  loadAll(): Observable<CredentialApiResponse[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.enap.get<CredentialApiResponse[]>('/credentials').pipe(
      tap({
        next: (data) => {
          this._list.set(data.map(mapCredentialToPersonalItem));
          this._loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando credenciales:', err);
          this._error.set('No se pudieron cargar los registros. Intenta de nuevo.');
          this._loading.set(false);
        },
      })
    );
  }

  /** Añade un ítem en memoria (después de un registro exitoso). */
  addItem(item: PersonalItem): void {
    this._list.update((prev) => [...prev, item]);
  }

  /**
   * Convierte el payload del formulario de registro en un PersonalItem
   * para añadirlo optimistamente a la lista.
   */
  payloadToPersonalItem(payload: RegistrationPayload): PersonalItem {
    const common = payload.common ?? {};
    const details = payload.details ?? {};
    const fullName = String(common['fullName'] ?? 'Sin nombre');
    const idNumber = String(common['idNumber'] ?? '');
    const year = new Date().getFullYear();
    const id = `new-${Date.now()}`;
    const identificacion = idNumber || `MIL-${year}-${String(Date.now()).slice(-6)}`;
    const rango =
      (details['grades'] as string) ||
      (details['force'] as string) ||
      'Por asignar';

    return {
      id,
      nombreCompleto: fullName,
      identificacion,
      rango,
      unidad: String(details['unit'] ?? ''),
      estado: 'pendiente',
      correo: `pendiente.${id}@fuerzasarmadas.mil`,
      fechaIngreso: formatDate(new Date()),
    };
  }
}

function formatDate(d: Date): string {
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}
