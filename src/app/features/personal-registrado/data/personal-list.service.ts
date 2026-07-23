import { HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { EnapApi } from '../../../core/services/enap.api';
import { ValidationService } from '../../../core/services/validation.service';
import { BYPASS_SPINNER } from '../../../core/interceptors/loading.interceptor';
import { buildFullName, type RegistrationPayload } from '../../../core/services/registration.service';
import {
  type CredentialApiResponse,
  type CredentialStatusSummary,
  type PaginatedCredentialsResponse,
  type PersonalItem,
  getCredentialTypeLabel,
  deriveValidoHasta,
  mapCredentialToPersonalItem,
  toCanonicalTypeCode,
} from '../models/personal-item.model';

export interface CredentialListFilters {
  status?: string | null;
  name?: string | null;
  email?: string | null;
  identity?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PersonalListService {
  private readonly _list = signal<PersonalItem[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _syncing = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalRecords = signal<number>(0);
  private readonly _currentPage = signal<number>(1);
  private readonly _pageSize = signal<number>(10);
  private readonly _totalPages = signal<number>(1);
  private readonly _globalTotalRecords = signal<number>(0);
  private readonly _summary = signal<CredentialStatusSummary>({
    activas: 0,
    inactivas: 0,
    pendientes: 0,
    expiradas: 0,
  });

  /** Señales públicas de solo lectura */
  readonly listSignal  = this._list.asReadonly();
  readonly loading     = this._loading.asReadonly();
  readonly syncing     = this._syncing.asReadonly();
  readonly error       = this._error.asReadonly();
  readonly totalRecords = this._totalRecords.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly globalTotalRecords = this._globalTotalRecords.asReadonly();
  readonly summary = this._summary.asReadonly();

  constructor(
    private enap: EnapApi,
    private validationService: ValidationService,
  ) {}

  /**
   * GET /credentials
   * Query params: page, limit, status, name, email, identity.
   * El backend filtra en BD, devuelve total/totalPages filtrados y summary.expiradas.
   */
  loadAll(
    page?: number,
    limit?: number,
    filters?: CredentialListFilters | null,
  ): Observable<CredentialApiResponse[]> {
    const hasExistingData = this._list().length > 0;

    // Solo mostramos el esqueleto de carga interno si no hay datos visibles.
    if (!hasExistingData) {
      this._loading.set(true);
    } else {
      this._syncing.set(true);
    }
    this._error.set(null);

    const context = new HttpContext().set(BYPASS_SPINNER, true);
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.name) {
      params = params.set('name', filters.name);
    }
    if (filters?.email) {
      params = params.set('email', filters.email);
    }
    if (filters?.identity) {
      params = params.set('identity', filters.identity);
    }

    return this.enap.get<PaginatedCredentialsResponse>('/credentials', params, context).pipe(
      tap({
        next: (response) => {
          this.assertCredentialsResponse(response);
          this.applyCredentialsResponse(response, filters);
          this._loading.set(false);
          this._syncing.set(false);
        },
      }),
      map((response) => response.data),
      catchError((err) => {
        console.error('Error cargando credenciales:', err);
        if (err?.status !== 429 && !hasExistingData) {
          this._error.set('No se pudieron cargar los registros. Intenta de nuevo.');
        }
        this._loading.set(false);
        this._syncing.set(false);
        return of([]);
      })
    );
  }

  /**
   * GET /credentials/:id
   * Obtiene el detalle de una credencial para construir la vista completa.
   */
  getById(id: string): Observable<PersonalItem> {
    const context = new HttpContext().set(BYPASS_SPINNER, true);

    return this.enap
      .get<CredentialApiResponse>(`/credentials/${encodeURIComponent(id)}`, undefined, context)
      .pipe(map(mapCredentialToPersonalItem));
  }

  /** Añade un ítem en memoria (después de un registro exitoso). */
  addItem(item: PersonalItem): void {
    this._list.update((prev) => [...prev, item]);
  }

  /** Comprueba si el correo ya existe en la lista cargada en memoria. */
  hasEmailInCache(email: string): boolean {
    const normalized = normalizeEmail(email);
    if (!normalized) return false;
    return this._list().some((item) => normalizeEmail(item.correo) === normalized);
  }

  /** Comprueba si la identificación ya existe en la lista cargada en memoria. */
  hasIdentityInCache(identityNumber: string): boolean {
    const normalized = normalizeIdentityNumber(identityNumber);
    if (!normalized) return false;
    return this._list().some(
      (item) => normalizeIdentityNumber(item.identificacion) === normalized,
    );
  }

  /**
   * Verifica en el API si el correo institucional ya está registrado.
   * El backend puede devolver 500 genérico por violación unique en Prisma.
   */
  /** GET /validations/email — con caché local de la lista cargada. */
  checkEmailExists(email: string): Observable<boolean> {
    if (!email.trim()) return of(false);
    if (this.hasEmailInCache(email)) return of(true);

    return this.validationService.checkEmailExists(email);
  }

  /** GET /validations/identity — con caché local de la lista cargada. */
  checkIdentityNumberExists(identityNumber: string): Observable<boolean> {
    if (!identityNumber.trim()) return of(false);
    if (this.hasIdentityInCache(identityNumber)) return of(true);

    return this.validationService.checkIdentityExists(identityNumber);
  }

  /**
   * Convierte el payload del formulario de registro en un PersonalItem
   * para añadirlo optimistamente a la lista.
   */
  payloadToPersonalItem(payload: RegistrationPayload): PersonalItem {
    const common = payload.common ?? {};
    const details = payload.details ?? {};
    const fullName = buildFullName(common as RegistrationPayload['common']) || 'Sin nombre';
    const idNumber = String(common['idNumber'] ?? '');
    const year = new Date().getFullYear();
    const id = `new-${Date.now()}`;
    const identificacion = idNumber || `MIL-${year}-${String(Date.now()).slice(-6)}`;
    const tipoRegistroCodigo = toCanonicalTypeCode(String(payload.type ?? 'militar'));
    const tipoRegistroNombre = getCredentialTypeLabel(tipoRegistroCodigo);
    const rango =
      (details['grades'] as string) ||
      (details['force'] as string) ||
      tipoRegistroNombre;

    const fechaIngreso = formatDate(new Date());
    const validUntilRaw = common.validUntil;
    const validoHasta = validUntilRaw
      ? formatDate(new Date(String(validUntilRaw)))
      : deriveValidoHasta(fechaIngreso);

    return {
      id,
      nombreCompleto: fullName,
      identificacion,
      rango,
      unidad: String(details['unit'] ?? details['force'] ?? ''),
      tipoRegistroCodigo,
      tipoRegistroNombre,
      detallesRegistro: details,
      estado: 'PENDING',
      correo: String(common['institutionalEmail'] ?? `pendiente.${id}@fuerzasarmadas.mil`),
      fechaIngreso,
      validoHasta,
      fechaNacimiento: formatDate(new Date(String(common['birthDate'] ?? ''))),
      telefono: String(common['phone'] ?? '') || undefined,
      tipoIdentificacion: String(common['idType'] ?? '') || undefined,
    };
  }

  private assertCredentialsResponse(response: PaginatedCredentialsResponse): void {
    if (!Array.isArray(response?.data)) {
      throw new Error('La respuesta de credenciales no contiene un arreglo en data.');
    }
  }

  private applyCredentialsResponse(
    response: PaginatedCredentialsResponse,
    filters?: CredentialListFilters | null,
  ): void {
    const items = response.data.map(mapCredentialToPersonalItem);
    this._list.set(items);
    this._totalRecords.set(response.total);
    const hasFilters = Boolean(
      filters?.status || filters?.name || filters?.email || filters?.identity,
    );
    if (!hasFilters) {
      this._globalTotalRecords.set(response.total);
    }
    this._currentPage.set(response.page);
    this._pageSize.set(response.limit);
    this._totalPages.set(response.totalPages);
    if (response.summary) {
      this._summary.set(response.summary);
    }
  }
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

function normalizeIdentityNumber(value: string | null | undefined): string {
  return (value ?? '').replace(/[\s.\-]/g, '').trim().toLowerCase();
}

function formatDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';

  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}
