import { Injectable, signal } from '@angular/core';
import type { RegistrationPayload } from '../../../core/services/registration.service';
import type { PersonalItem } from '../models/personal-item.model';
import { PERSONAL_DEMO_DATA } from './personal-demo.data';

@Injectable({
  providedIn: 'root',
})
export class PersonalListService {
  private readonly list = signal<PersonalItem[]>([...PERSONAL_DEMO_DATA] as PersonalItem[]);

  /** Lista de personal: demo + registros añadidos en sesión. */
  readonly listSignal = this.list.asReadonly();

  addItem(item: PersonalItem): void {
    this.list.update((prev) => [...prev, item]);
  }

  /**
   * Convierte el payload del formulario de registro en un PersonalItem
   * para añadirlo a la lista (demo sin API).
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
    const fechaIngreso = formatDate(new Date());

    return {
      id,
      nombreCompleto: fullName,
      identificacion,
      rango,
      estado: 'pendiente',
      correo: `pendiente.${id}@fuerzasarmadas.mil`,
      fechaIngreso,
    };
  }
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
