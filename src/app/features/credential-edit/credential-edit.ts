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
import {
  mapCredentialToEditForm,
  type CredentialEditContext,
} from '../../shared/utils/credential-form.mapper';
import {
  CREDENTIAL_STATUS_OPTIONS,
  getCredentialStatusLabel,
  getIdTypeLabel,
} from '../../shared/utils/credential-status.utils';
import { getPhotoUrl } from '../../shared/utils/url.utils';
import { getHttpErrorMessage } from '../../shared/utils/http-error.utils';
import { buildDuplicateEmailAlert } from '../../shared/utils/registration-error.utils';
import {
  type AvailabilityStatus,
  digitsOnlyValidator,
  institutionalEmailValidator,
  isValidEmailFormat,
  patchDuplicateError,
} from '../../shared/utils/registration-validation.utils';

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
  readonly getIdTypeLabel = getIdTypeLabel;
  readonly getCredentialStatusLabel = getCredentialStatusLabel;

  loading = signal(true);
  submitting = signal(false);
  context = signal<CredentialEditContext | null>(null);
  activeSchema = signal<CredentialTypeSchema | null>(null);
  detailsInitialValues = signal<Record<string, unknown>>({});
  originalEmail = signal('');
  existingPhotoPath = signal<string | null>(null);
  selectedPhoto?: File;
  photoPreviewUrl = signal<string | null>(null);
  emailAvailability = signal<AvailabilityStatus>('idle');

  readonly minValidUntilDate = new Date();

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
  }

  ngOnDestroy(): void {
    const prev = this.photoPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
  }

  canSubmit(): boolean {
    if (this.loading() || this.submitting()) return false;
    if (this.editForm.invalid || this.detailsGroup.invalid) return false;
    if (this.emailAvailability() === 'checking') return false;

    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;
    const email = String(emailCtrl.value ?? '').trim();
    if (emailCtrl.hasError('duplicateEmail')) return false;
    if (!isValidEmailFormat(email) || this.emailAvailability() !== 'available') return false;

    return true;
  }

  isEmailVerified(): boolean {
    const email = String(this.editForm.controls.common.controls.institutionalEmail.value ?? '').trim();
    return isValidEmailFormat(email) && this.emailAvailability() === 'available';
  }

  onDigitsOnlyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
    this.editForm.controls.common.controls.phone.setValue(input.value);
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
    input.value = '';
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    this.editForm.markAllAsTouched();
    this.detailsGroup.markAllAsTouched();

    if (!this.canSubmit()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Revise los campos marcados antes de guardar.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    const ctx = this.context();
    if (!ctx) return;

    const raw = this.editForm.getRawValue();
    const email = raw.common.institutionalEmail.trim();
    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;

    if (email && email.toLowerCase() !== this.originalEmail().toLowerCase()) {
      const exists = await firstValueFrom(this.validationService.checkEmailExists(email));
      if (exists) {
        patchDuplicateError(emailCtrl, 'duplicateEmail', true);
        this.emailAvailability.set('duplicate');
        const alert = buildDuplicateEmailAlert(email);
        void Swal.fire({
          icon: alert.icon,
          title: alert.title,
          text: alert.text,
          confirmButtonColor: '#163665',
        });
        return;
      }
    }

    const payload: UpdateCredentialPayload = {
      type: ctx.credentialTypeCode,
      status: raw.status,
      common: {
        ...raw.common,
        idType: ctx.idType,
        idNumber: ctx.idNumber,
      },
      details: raw.details as Record<string, unknown>,
    };

    this.submitting.set(true);
    this.registrationService.updateRegistration(ctx.id, payload, this.selectedPhoto).subscribe({
      next: (updated) => void this.handleSuccess(updated),
      error: (err) => {
        void Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: getHttpErrorMessage(err, 'No se pudieron guardar los cambios.'),
          confirmButtonColor: '#163665',
        });
      },
      complete: () => this.submitting.set(false),
    });
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

      this.editForm.patchValue({
        status: mapped.form.status,
        common: mapped.form.common,
      });
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

  private setupEmailValidator(): void {
    const emailCtrl = this.editForm.controls.common.controls.institutionalEmail;

    emailCtrl.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap(() => {
          this.emailAvailability.set('idle');
          patchDuplicateError(emailCtrl, 'duplicateEmail', false);
        }),
        filter((value) => isValidEmailFormat(value)),
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

  private async handleSuccess(updated: CredentialApiResponse): Promise<void> {
    const page = this.personalListService.currentPage();
    const limit = this.personalListService.pageSize();
    await firstValueFrom(this.personalListService.loadAll(page, limit));

    await Swal.fire({
      icon: 'success',
      title: 'Credencial actualizada',
      text: 'Los cambios se guardaron correctamente.',
      confirmButtonColor: '#163665',
    });

    void this.router.navigate(['/personal-registrado', 'credential', updated.id], {
      state: { credential: mapCredentialToPersonalItem(updated) },
    });
  }
}
