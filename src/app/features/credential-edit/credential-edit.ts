import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  merge,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import {
  RegistrationService,
  type UpdateCredentialPayload,
} from '../../core/services/registration.service';
import { ValidationService } from '../../core/services/validation.service';
import { CredentialTypeService } from '../../core/services/credential-type.service';
import { PersonalListService } from '../personal-registrado/data/personal-list.service';
import {
  mapCredentialToPersonalItem,
  type CredentialApiResponse,
} from '../personal-registrado/models/personal-item.model';
import type { CredentialTypeSchema } from '../../core/models/credential-type.model';
import { DynamicCredentialForm } from '../registration/components/forms/dynamic-credential-form/dynamic-credential-form';
import { DateInputMaskDirective } from '../../shared/directives/date-input-mask.directive';
import { IdentityInputMaskDirective } from '../../shared/directives/identity-input-mask.directive';
import { PhoneInputMaskDirective } from '../../shared/directives/phone-input-mask.directive';
import {
  mapCredentialToEditForm,
  type CredentialEditContext,
} from '../../shared/utils/credential-form.mapper';
import {
  CREDENTIAL_STATUS_OPTIONS,
  getCredentialStatusLabel,
  getIdTypeLabel,
  normalizeCredentialStatus,
} from '../../shared/utils/credential-status.utils';
import { isCredentialExpired } from '../../shared/utils/credential-expiration.utils';
import { getPhotoUrl } from '../../shared/utils/url.utils';
import { getHttpErrorMessage } from '../../shared/utils/http-error.utils';
import { buildDuplicateEmailAlert } from '../../shared/utils/registration-error.utils';
import {
  type AvailabilityStatus,
  digitsOnlyValidator,
  institutionalEmailValidator,
  isIdentityReadyForLookup,
  isPlaceholderDraftIdentity,
  isValidEmailFormat,
  patchDuplicateError,
} from '../../shared/utils/registration-validation.utils';

type IdType = 'cc' | 'ti' | 'ce' | 'pasaporte';
type IdTypeOption = { value: IdType; label: string };

@Component({
  selector: 'app-credential-edit',
  standalone: true,
  templateUrl: './credential-edit.html',
  styleUrls: ['./credential-edit.scss', '../registration/registration.scss'],
  host: { class: 'reg-host' },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    BreadcrumbComponent,
    DynamicCredentialForm,
    DateInputMaskDirective,
    IdentityInputMaskDirective,
    PhoneInputMaskDirective,
  ],
})
export class CredentialEdit implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly layoutLoading = inject(LayoutLoadingService);
  private readonly registrationService = inject(RegistrationService);
  private readonly validationService = inject(ValidationService);
  private readonly credentialTypeService = inject(CredentialTypeService);
  private readonly personalListService = inject(PersonalListService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = CREDENTIAL_STATUS_OPTIONS;
  readonly idTypes: IdTypeOption[] = [
    { value: 'cc', label: 'Cédula de ciudadanía (CC)' },
    { value: 'ti', label: 'Tarjeta de identidad (TI)' },
    { value: 'ce', label: 'Cédula de extranjería (CE)' },
    { value: 'pasaporte', label: 'Pasaporte' },
  ];
  readonly getIdTypeLabel = getIdTypeLabel;
  readonly getCredentialStatusLabel = getCredentialStatusLabel;

  loading = signal(true);
  submitting = signal(false);
  context = signal<CredentialEditContext | null>(null);
  activeSchema = signal<CredentialTypeSchema | null>(null);
  detailsInitialValues = signal<Record<string, unknown>>({});
  originalEmail = signal('');
  originalIdentity = signal('');
  existingPhotoPath = signal<string | null>(null);
  selectedPhoto?: File;
  photoPreviewUrl = signal<string | null>(null);
  photoRequired = signal(false);
  emailAvailability = signal<AvailabilityStatus>('idle');
  identityAvailability = signal<AvailabilityStatus>('idle');
  private readonly formStateTick = signal(0);

  readonly editForm = this.fb.group({
    status: this.fb.control('ACTIVE', { validators: [Validators.required] }),
    common: this.fb.group({
      firstName: this.fb.control('', { validators: [Validators.required] }),
      lastName: this.fb.control('', { validators: [Validators.required] }),
      birthDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      validUntil: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      institutionalEmail: this.fb.control('', {
        validators: [Validators.required, institutionalEmailValidator()],
      }),
      phone: this.fb.control('', { validators: [digitsOnlyValidator()] }),
      idType: this.fb.control<IdType | ''>(''),
      idNumber: this.fb.control(''),
    }),
    details: this.fb.group({}),
  });

  get detailsGroup() {
    return this.editForm.controls.details;
  }

  constructor() {
    this.layoutLoading.setLoading(false);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/personal-registrado']);
      return;
    }
    void this.loadCredential(id);
    this.setupEmailValidator();
    this.setupIdentityValidator();
    this.setupFormStateWatcher();
  }

  ngOnDestroy(): void {
    const prev = this.photoPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
  }

  canSubmit(): boolean {
    this.formStateTick();

    if (this.loading() || this.submitting()) return false;
    if (this.editForm.invalid || this.detailsGroup.invalid) return false;
    if (this.emailAvailability() === 'checking' || this.identityAvailability() === 'checking') {
      return false;
    }

    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;
    const email = String(emailCtrl.value ?? '').trim();
    if (emailCtrl.hasError('duplicateEmail')) return false;
    if (!isValidEmailFormat(email)) return false;

    if (this.isPendingCredential()) {
      const idCtrl = this.editForm.controls.common.controls.idNumber;
      const idNumber = String(idCtrl.value ?? '').trim();
      if (idCtrl.hasError('duplicateIdentity')) return false;
      if (!isIdentityReadyForLookup(idNumber)) return false;
      if (!this.isIdentityUnchanged(idNumber) && this.identityAvailability() !== 'available') {
        return false;
      }
      if (!this.hasCredentialPhoto()) return false;
    }

    if (this.isEmailUnchanged(email)) return true;

    return this.emailAvailability() === 'available';
  }

  isIdentityVerified(): boolean {
    if (!this.isPendingCredential()) return true;

    const idNumber = String(this.editForm.controls.common.controls.idNumber.value ?? '').trim();
    if (!isIdentityReadyForLookup(idNumber)) return false;
    if (this.isIdentityUnchanged(idNumber)) return true;
    return this.identityAvailability() === 'available';
  }

  isEmailVerified(): boolean {
    const email = String(this.editForm.controls.common.controls.institutionalEmail.value ?? '').trim();
    if (!isValidEmailFormat(email)) return false;
    if (this.isEmailUnchanged(email)) return true;
    return this.emailAvailability() === 'available';
  }

  getSubmitBlockers(): string[] {
    this.formStateTick();

    if (this.canSubmit()) return [];

    const blockers: string[] = [];

    if (this.loading()) {
      blockers.push('Cargando credencial...');
      return blockers;
    }

    if (this.submitting()) {
      blockers.push('Guardando cambios...');
      return blockers;
    }

    if (this.isPendingCredential() && !this.hasCredentialPhoto()) {
      blockers.push('Foto para credencial');
    }

    if (this.editForm.controls.status.invalid) {
      blockers.push('Estado de la credencial');
    }

    const common = this.editForm.controls.common.controls;
    const fieldLabels: Record<string, string> = {
      firstName: 'Nombres',
      lastName: 'Apellidos',
      birthDate: 'Fecha de nacimiento',
      validUntil: 'Vigencia de la credencial',
      institutionalEmail: 'Correo institucional',
      phone: 'Teléfono (solo dígitos)',
      idType: 'Tipo de identificación',
      idNumber: 'Número de identificación',
    };

    for (const [key, label] of Object.entries(fieldLabels)) {
      const control = common[key as keyof typeof common];
      if (control?.invalid) {
        blockers.push(label);
      }
    }

    const emailCtrl = common.institutionalEmail;
    const email = String(emailCtrl.value ?? '').trim();
    if (emailCtrl.hasError('duplicateEmail')) {
      blockers.push('Correo institucional ya registrado');
    } else if (!this.isEmailUnchanged(email)) {
      if (this.emailAvailability() === 'checking') {
        blockers.push('Verificando correo institucional...');
      } else if (emailCtrl.hasError('email') || !isValidEmailFormat(email)) {
        blockers.push('Correo institucional con formato válido');
      } else if (this.emailAvailability() !== 'available') {
        blockers.push('Espere la verificación del correo institucional');
      }
    }

    if (this.isPendingCredential()) {
      const idCtrl = common.idNumber;
      const idNumber = String(idCtrl.value ?? '').trim();
      if (idCtrl.hasError('duplicateIdentity')) {
        blockers.push('Número de identificación ya registrado');
      } else if (!this.isIdentityUnchanged(idNumber)) {
        if (this.identityAvailability() === 'checking') {
          blockers.push('Verificando número de identificación...');
        } else if (idCtrl.hasError('required')) {
          blockers.push('Número de identificación');
        } else if (idCtrl.hasError('digitsOnly')) {
          blockers.push('Número de identificación (solo dígitos)');
        } else if (!isIdentityReadyForLookup(idNumber)) {
          blockers.push('Número de identificación (mínimo 5 dígitos)');
        } else if (this.identityAvailability() !== 'available') {
          blockers.push('Espere la verificación del número de identificación');
        }
      }
    }

    for (const field of this.activeSchema()?.fields ?? []) {
      const control = this.detailsGroup.get(field.name);
      if (control?.invalid) {
        blockers.push(field.label);
      }
    }

    return blockers;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png'];
    const maxBytes = 5 * 1024 * 1024;

    if (!allowed.includes(file.type)) {
      void Swal.fire({
        icon: 'error',
        title: 'Formato inválido',
        text: 'Solo se permiten imágenes JPG o PNG.',
        confirmButtonColor: '#163665',
      });
      input.value = '';
      return;
    }

    if (file.size > maxBytes) {
      void Swal.fire({
        icon: 'error',
        title: 'Archivo demasiado grande',
        text: 'El archivo no debe superar 5MB.',
        confirmButtonColor: '#163665',
      });
      input.value = '';
      return;
    }

    this.selectedPhoto = file;
    const prev = this.photoPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    this.photoPreviewUrl.set(URL.createObjectURL(file));
    this.photoRequired.set(false);
    input.value = '';
  }

  hasCredentialPhoto(): boolean {
    return Boolean(this.selectedPhoto) || Boolean(this.existingPhotoPath());
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    this.editForm.markAllAsTouched();
    this.detailsGroup.markAllAsTouched();

    if (this.isPendingCredential() && !this.hasCredentialPhoto()) {
      this.photoRequired.set(true);
    }

    const missing = this.getSubmitBlockers();
    if (missing.length > 0) {
      const listHtml = missing.map((field) => `<li>${field}</li>`).join('');
      await Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        html: `<p style="margin:0 0 8px">Complete los siguientes campos:</p><ul style="text-align:left;margin:0;padding-left:1.25rem">${listHtml}</ul>`,
        confirmButtonColor: '#163665',
      });
      return;
    }

    const ctx = this.context();
    if (!ctx) return;

    const raw = this.editForm.getRawValue();
    const email = raw.common.institutionalEmail.trim();
    const idNumber = String(raw.common.idNumber ?? '').trim();
    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;
    const idCtrl = this.editForm.controls.common.controls.idNumber;

    if (email && email.toLowerCase() !== this.originalEmail().toLowerCase()) {
      const exists = await firstValueFrom(this.validationService.checkEmailExists(email));
      if (exists) {
        patchDuplicateError(emailCtrl, 'duplicateEmail', true);
        this.emailAvailability.set('duplicate');
        const alert = buildDuplicateEmailAlert(email);
        await Swal.fire({
          icon: alert.icon,
          title: alert.title,
          text: alert.text,
          confirmButtonColor: '#163665',
        });
        return;
      }
    }

    if (
      this.isPendingCredential() &&
      idNumber &&
      !this.isIdentityUnchanged(idNumber)
    ) {
      const identityExists = await firstValueFrom(
        this.validationService.checkIdentityExists(idNumber),
      );
      if (identityExists) {
        patchDuplicateError(idCtrl, 'duplicateIdentity', true);
        this.identityAvailability.set('duplicate');
        await Swal.fire({
          icon: 'error',
          title: 'Identificación ya registrada',
          text: `El número ${idNumber} ya está asociado a otra credencial.`,
          confirmButtonColor: '#163665',
        });
        return;
      }
    }

    const payload: UpdateCredentialPayload = {
      type: ctx.credentialTypeCode,
      status: this.resolveSubmitStatus(raw.status, raw.common.validUntil),
      common: {
        ...raw.common,
        idType: this.isPendingCredential() ? raw.common.idType : ctx.idType,
        idNumber: this.isPendingCredential() ? idNumber : ctx.idNumber,
      },
      details: raw.details as Record<string, unknown>,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.registrationService.updateRegistration(ctx.id, payload, this.selectedPhoto),
      );
      const refreshed = await firstValueFrom(this.registrationService.getCredential(ctx.id));
      await this.handleSuccess(refreshed);
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: getHttpErrorMessage(err, 'No se pudieron guardar los cambios.'),
        confirmButtonColor: '#163665',
      });
    } finally {
      this.submitting.set(false);
    }
  }

  isPendingCredential(): boolean {
    return this.context()?.status === 'PENDING';
  }

  onCancel(): void {
    const ctx = this.context();
    if (ctx) {
      void this.router.navigate(['/personal-registrado', 'credential', ctx.id]);
      return;
    }
    void this.router.navigate(['/personal-registrado']);
  }

  private async loadCredential(id: string): Promise<void> {
    this.loading.set(true);

    try {
      const credential = await firstValueFrom(this.registrationService.getCredential(id));
      const mapped = mapCredentialToEditForm(credential);
      const type = await firstValueFrom(
        this.credentialTypeService.getByCode(mapped.context.credentialTypeCode),
      );

      this.context.set(mapped.context);
      this.activeSchema.set(type.schema ?? { fields: [] });
      this.detailsInitialValues.set(mapped.form.details);
      this.originalEmail.set(mapped.form.common.institutionalEmail);
      this.existingPhotoPath.set(credential.imagePath ?? null);
      this.emailAvailability.set('available');

      if (credential.imagePath) {
        this.photoPreviewUrl.set(getPhotoUrl(credential.imagePath));
      }

      const isPending = mapped.context.status === 'PENDING';
      const editableIdNumber = isPlaceholderDraftIdentity(mapped.context.idNumber)
        ? ''
        : mapped.context.idNumber;
      const editableIdType = this.normalizeEditableIdType(mapped.context.idType);

      if (isPending) {
        this.configurePendingIdentityFields(editableIdNumber);
      } else {
        this.clearPendingIdentityFields();
      }

      this.editForm.patchValue(
        {
          status: isPending ? 'ACTIVE' : mapped.form.status,
          common: {
            ...mapped.form.common,
            idType: isPending ? editableIdType : '',
            idNumber: isPending ? editableIdNumber : '',
          },
        },
        { emitEvent: false },
      );
      this.editForm.updateValueAndValidity();
    } catch (error) {
      console.error('No se pudo cargar la credencial', error);
      await Swal.fire({
        icon: 'error',
        title: 'Credencial no encontrada',
        text: 'No fue posible cargar los datos para edición.',
        confirmButtonColor: '#163665',
      });
      void this.router.navigate(['/personal-registrado']);
    } finally {
      this.loading.set(false);
    }
  }

  private setupFormStateWatcher(): void {
    merge(
      this.editForm.statusChanges,
      this.editForm.valueChanges,
      this.detailsGroup.statusChanges,
      this.detailsGroup.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formStateTick.update((n: number) => n + 1));
  }

  private isEmailUnchanged(email: string): boolean {
    return email.toLowerCase() === this.originalEmail().trim().toLowerCase();
  }

  private isIdentityUnchanged(idNumber: string): boolean {
    const original = this.originalIdentity().trim();
    const current = idNumber.trim();
    return Boolean(original) && current === original;
  }

  private normalizeEditableIdType(value: string): IdType | '' {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'cc' || normalized === 'ti' || normalized === 'ce' || normalized === 'pasaporte') {
      return normalized;
    }
    return '';
  }

  private configurePendingIdentityFields(idNumber: string): void {
    const idTypeCtrl = this.editForm.controls.common.controls.idType;
    const idNumberCtrl = this.editForm.controls.common.controls.idNumber;

    idTypeCtrl.setValidators([Validators.required]);
    idNumberCtrl.setValidators([Validators.required, digitsOnlyValidator(false)]);
    idTypeCtrl.updateValueAndValidity({ emitEvent: false });
    idNumberCtrl.updateValueAndValidity({ emitEvent: false });

    this.originalIdentity.set(idNumber);
    this.identityAvailability.set(
      idNumber && isIdentityReadyForLookup(idNumber) ? 'available' : 'idle',
    );
  }

  private clearPendingIdentityFields(): void {
    const idTypeCtrl = this.editForm.controls.common.controls.idType;
    const idNumberCtrl = this.editForm.controls.common.controls.idNumber;

    idTypeCtrl.clearValidators();
    idNumberCtrl.clearValidators();
    idTypeCtrl.updateValueAndValidity({ emitEvent: false });
    idNumberCtrl.updateValueAndValidity({ emitEvent: false });
    this.originalIdentity.set('');
    this.identityAvailability.set('idle');
  }

  private setupIdentityValidator(): void {
    const idCtrl = this.editForm.controls.common.controls.idNumber;

    idCtrl.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        filter(() => this.isPendingCredential()),
        tap(() => {
          this.identityAvailability.set('idle');
          patchDuplicateError(idCtrl, 'duplicateIdentity', false);
        }),
        filter((value) => {
          const normalized = String(value ?? '').trim();
          if (normalized && this.isIdentityUnchanged(normalized)) return false;
          return isIdentityReadyForLookup(value);
        }),
        tap(() => this.identityAvailability.set('checking')),
        switchMap((value) => this.validationService.checkIdentityExists(value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((exists) => {
        this.identityAvailability.set(exists ? 'duplicate' : 'available');
        patchDuplicateError(idCtrl, 'duplicateIdentity', exists);
      });
  }

  private setupEmailValidator(): void {
    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;

    emailCtrl.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap((value) => {
          patchDuplicateError(emailCtrl, 'duplicateEmail', false);
          if (this.isEmailUnchanged(String(value ?? '').trim())) {
            this.emailAvailability.set('available');
            return;
          }
          this.emailAvailability.set('idle');
        }),
        filter((value) => {
          const email = String(value ?? '').trim();
          if (this.isEmailUnchanged(email)) return false;
          return isValidEmailFormat(email);
        }),
        tap(() => this.emailAvailability.set('checking')),
        switchMap((value) => {
          if (value.trim().toLowerCase() === this.originalEmail().trim().toLowerCase()) {
            return of(false);
          }
          return this.validationService.checkEmailExists(value);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((exists) => {
        this.emailAvailability.set(exists ? 'duplicate' : 'available');
        patchDuplicateError(emailCtrl, 'duplicateEmail', exists);
      });
  }

  private resolveSubmitStatus(
    formStatus: string,
    validUntil: Date | null,
  ): string {
    if (this.context()?.status === 'PENDING') {
      return 'ACTIVE';
    }

    const normalized = normalizeCredentialStatus(formStatus);

    if (validUntil && !isCredentialExpired(validUntil) && normalized === 'EXPIRED') {
      return 'ACTIVE';
    }

    if (validUntil && isCredentialExpired(validUntil) && normalized === 'ACTIVE') {
      return 'EXPIRED';
    }

    return formStatus;
  }

  private async handleSuccess(updated: CredentialApiResponse): Promise<void> {
    if (this.context()?.status === 'PENDING') {
      RegistrationService.clearDraftStorage();
    }

    const page = this.personalListService.currentPage();
    const limit = this.personalListService.pageSize();
    await firstValueFrom(this.personalListService.loadAll(page, limit));

    await Swal.fire({
      icon: 'success',
      title: this.context()?.status === 'PENDING' ? 'Credencial activada' : 'Credencial actualizada',
      text:
        this.context()?.status === 'PENDING'
          ? 'La credencial se completó y ahora está activa.'
          : 'Los cambios se guardaron correctamente.',
      confirmButtonColor: '#163665',
    });

    if (this.context()?.status === 'PENDING') {
      void this.router.navigate(['/personal-registrado']);
      return;
    }

    void this.router.navigate(['/personal-registrado', 'credential', updated.id], {
      state: { credential: mapCredentialToPersonalItem(updated) },
    });
  }
}
