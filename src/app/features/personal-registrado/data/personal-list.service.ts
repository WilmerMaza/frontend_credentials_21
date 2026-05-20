import { HttpContext } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { EnapApi } from '../../../core/services/enap.api';
import { BYPASS_SPINNER } from '../../../core/interceptors/loading.interceptor';
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
  private readonly _syncing = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly CACHE_KEY = 'enap-personal-cache';

  /** Señales públicas de solo lectura */
  readonly listSignal  = this._list.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly syncing     = this._syncing.asReadonly();
  readonly error       = this._error.asReadonly();

  constructor(private enap: EnapApi) {
    // Restaurar caché al inicializar
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.CACHE_KEY);
        if (cached) {
          this._list.set(JSON.parse(cached));
        }
      } catch (e) {
        console.error('Error restaurando caché:', e);
      }
    }
  }

  /**
   * GET /credentials
   * Carga todos los registros desde el API y los mapea al modelo interno.
   * Utiliza la estrategia Stale-While-Revalidate con caché local y actualización en segundo plano.
   */
  loadAll(): Observable<CredentialApiResponse[]> {
    const hasCache = this._list().length > 0;

    // Solo mostramos el esqueleto de carga interno si no hay nada en el caché.
    if (!hasCache) {
      this._loading.set(true);
    } else {
      this._syncing.set(true);
    }
    this._error.set(null);

    const context = new HttpContext().set(BYPASS_SPINNER, true);

    return this.enap.get<CredentialApiResponse[]>('/credentials', undefined, context).pipe(
      tap({
        next: (data) => {
          const items = data.map(mapCredentialToPersonalItem);
          this._list.set(items);

          // Guardar en caché local
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(this.CACHE_KEY, JSON.stringify(items));
            } catch (e) {
              console.error('Error guardando en caché:', e);
            }
          }

          this._loading.set(false);
          this._syncing.set(false);
        },
        error: (err) => {
          console.error('Error cargando credenciales:', err);
          if (!hasCache) {
            this._error.set('No se pudieron cargar los registros. Intenta de nuevo.');
          }
          this._loading.set(false);
          this._syncing.set(false);
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
