import { CommonModule } from '@angular/common';
import {
  Component,
  afterNextRender,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { debounceTime, distinctUntilChanged, filter, firstValueFrom, switchMap, tap } from 'rxjs';
import { PersonalListService } from '../personal-registrado/data/personal-list.service';
import {
  mapCredentialToPersonalItem,
  type CredentialApiResponse,
} from '../personal-registrado/models/personal-item.model';
import {
  REGISTRATION_DRAFT_KEY,
  RegistrationService,
  type RegistrationFormAutosave,
  type RegistrationPayload,
} from '../../core/services/registration.service';
import {
  mapCredentialToRegistrationForm,
  type RegistrationFormValues,
} from '../../shared/utils/credential-form.mapper';
import { ValidationService } from '../../core/services/validation.service';
import { CredentialPdfService } from '../../core/services/credential-pdf.service';
import { MailService } from '../../core/services/mail.service';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { NavigationService } from '../../core/services/navigation.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { buildCredentialPdfData } from '../credential-view/credential-mapper';
import type { PersonalItemWithExtras } from '../credential-view/credential-mapper';
import { getPhotoUrl } from '../../shared/utils/url.utils';
import { getHttpErrorMessage } from '../../shared/utils/http-error.utils';
import {
  buildDuplicateEmailAlert,
  getRegistrationErrorAlert,
} from '../../shared/utils/registration-error.utils';
import {
  getCameraErrorAlert,
  getCameraSupportInfo,
  getNativeCaptureFallbackAlert,
} from '../../shared/utils/camera-support.utils';
import {
  type AvailabilityStatus,
  digitsOnlyValidator,
  institutionalEmailValidator,
  isIdentityReadyForLookup,
  isValidEmailFormat,
  patchDuplicateError,
} from '../../shared/utils/registration-validation.utils';

import { CredentialTypeService } from '../../core/services/credential-type.service';
import type {
  CredentialTypeApiResponse,
  CredentialTypeSchema,
} from '../../core/models/credential-type.model';
import { DynamicCredentialForm } from './components/forms/dynamic-credential-form/dynamic-credential-form';
import { DateInputMaskDirective } from '../../shared/directives/date-input-mask.directive';
import { IdentityInputMaskDirective } from '../../shared/directives/identity-input-mask.directive';
import { PhoneInputMaskDirective } from '../../shared/directives/phone-input-mask.directive';
import { getCredentialTypeLabel } from '../personal-registrado/models/personal-item.model';

type RegistrationType = string;
type IdType = 'cc' | 'ti' | 'ce' | 'pasaporte';

type IdTypeOption = { value: IdType; label: string };

@Component({
  selector: 'app-registration',
  standalone: true,
  templateUrl: './registration.html',
  styleUrls: ['./registration.scss'],
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
export class Registration implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly layoutLoading = inject(LayoutLoadingService);
  private readonly registrationService = inject(RegistrationService);
  private readonly personalListService = inject(PersonalListService);
  private readonly validationService = inject(ValidationService);
  private readonly credentialPdfService = inject(CredentialPdfService);
  private readonly mailService = inject(MailService);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly credentialTypeService = inject(CredentialTypeService);
  private readonly destroyRef = inject(DestroyRef);

  private static loadDraft(): Record<string, unknown> | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  submitting = signal(false);
  savingDraft = signal(false);
  draftCredentialId = signal<string | null>(null);
  private originalEmail = signal('');
  private originalIdentity = signal('');
  selectedPhoto?: File;
  photoPreviewUrl = signal<string | null>(null);
  photoRequired = signal(false);
  emailAvailability = signal<AvailabilityStatus>('idle');
  identityAvailability = signal<AvailabilityStatus>('idle');
  identitySectionExpanded = signal(true);
  detailsSectionExpanded = signal(true);
  showCameraOverlay = signal(false);

  private cameraVideoRef = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo');
  private cameraCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas');
  private cameraInputRef = viewChild<ElementRef<HTMLInputElement>>('cameraInput');
  private cameraStream: MediaStream | null = null;
  private isRestoringForm = false;
  private cachedPhotoDataUrl: string | undefined;

  readonly types = signal<Array<{ value: RegistrationType; label: string }>>([]);
  readonly activeSchema = signal<CredentialTypeSchema | null>(null);
  readonly detailsInitialValues = signal<Record<string, unknown>>({});
  private credentialTypes = signal<CredentialTypeApiResponse[]>([]);

  readonly idTypes: IdTypeOption[] = [
    { value: 'cc', label: 'Cédula de ciudadanía (CC)' },
    { value: 'ti', label: 'Tarjeta de identidad (TI)' },
    { value: 'ce', label: 'Cédula de extranjería (CE)' },
    { value: 'pasaporte', label: 'Pasaporte' },
  ];

  readonly minValidUntilDate = new Date();

  // ✅ Form: type + common + details
  readonly registrationForm = this.fb.group({
    type: this.fb.control<RegistrationType>('militar', {
      validators: [Validators.required],
    }),

    common: this.fb.group({
      firstName:          this.fb.control('', { validators: [Validators.required] }),
      lastName:           this.fb.control('', { validators: [Validators.required] }),
      idType:             this.fb.control<IdType | ''>('', { validators: [Validators.required] }),
      idNumber:           this.fb.control('', { validators: [Validators.required, digitsOnlyValidator(false)] }),
      birthDate:          this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      validUntil:         this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      institutionalEmail: this.fb.control('', {
        validators: [Validators.required, institutionalEmailValidator()],
      }),
      phone:              this.fb.control('', { validators: [digitsOnlyValidator()] }),
    }),

    details: this.fb.group({}),
  });

  get detailsGroup(): FormGroup {
    return this.registrationForm.controls.details as FormGroup;
  }

  getTypeLabel(): string {
    const v = this.registrationForm.controls.type.value;
    return this.types().find((t) => t.value === v)?.label ?? v ?? '';
  }

  toggleIdentitySection(): void {
    this.identitySectionExpanded.update((v) => !v);
  }

  toggleDetailsSection(): void {
    this.detailsSectionExpanded.update((v) => !v);
  }

  // ✅ solo lo llama el select "type"
  onTypeChange(next: RegistrationType): void {
    Object.keys(this.detailsGroup.controls).forEach((k) => this.detailsGroup.removeControl(k));
    this.detailsGroup.reset();
    this.detailsInitialValues.set({});
    const selected = this.credentialTypes().find((type) => type.code === next);
    this.activeSchema.set(selected?.schema ?? { fields: [] });
  }

  constructor() {
    this.layoutLoading.setLoading(false);
    this.setupRealtimeValidators();
    this.setupFormAutosave();
    void this.loadCredentialTypes();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.persistFormCacheSync();
  }

  canSaveDraft(): boolean {
    return this.getDraftSaveBlockers().length === 0;
  }

  getDraftSaveBlockers(): string[] {
    const blockers: string[] = [];

    const idCtrl = this.registrationForm.controls.common.controls.idNumber;
    const idNumber = String(idCtrl.value ?? '').trim();

    if (idCtrl.hasError('duplicateIdentity')) {
      blockers.push('Número de identificación ya registrado');
    } else if (this.identityAvailability() === 'checking') {
      blockers.push('Verificando número de identificación...');
    } else if (idCtrl.hasError('required') || !idNumber) {
      blockers.push('Número de identificación requerido');
    } else if (idCtrl.hasError('digitsOnly')) {
      blockers.push('Número de identificación (solo dígitos)');
    } else if (!isIdentityReadyForLookup(idNumber)) {
      blockers.push('Número de identificación (mínimo 5 dígitos)');
    } else if (idNumber !== this.originalIdentity() && this.identityAvailability() === 'checking') {
      blockers.push('Verificando número de identificación...');
    } else if (idNumber !== this.originalIdentity() && this.identityAvailability() === 'duplicate') {
      blockers.push('Número de identificación ya registrado');
    }

    return blockers;
  }

  canSubmitForm(): boolean {
    if (this.submitting()) return false;
    if (!this.selectedPhoto) return false;
    if (this.registrationForm.invalid || this.detailsGroup.invalid) return false;
    if (this.emailAvailability() === 'checking' || this.identityAvailability() === 'checking') {
      return false;
    }

    const common = this.registrationForm.controls.common.controls;
    const email = String(common.institutionalEmail.value ?? '').trim();
    const idNumber = String(common.idNumber.value ?? '').trim();

    if (common.institutionalEmail.hasError('duplicateEmail')) return false;
    if (common.idNumber.hasError('duplicateIdentity')) return false;
    if (!isValidEmailFormat(email) || this.emailAvailability() !== 'available') return false;
    if (!isIdentityReadyForLookup(idNumber) || this.identityAvailability() !== 'available') {
      return false;
    }

    return true;
  }

  isEmailVerified(): boolean {
    const email = String(
      this.registrationForm.controls.common.controls.institutionalEmail.value ?? '',
    ).trim();
    return isValidEmailFormat(email) && this.emailAvailability() === 'available';
  }

  isIdentityVerified(): boolean {
    const idNumber = String(
      this.registrationForm.controls.common.controls.idNumber.value ?? '',
    ).trim();
    if (!isIdentityReadyForLookup(idNumber)) return false;
    if (idNumber === this.originalIdentity()) return true;
    return this.identityAvailability() === 'available';
  }

  getSubmitBlockers(): string[] {
    if (this.canSubmitForm()) return [];

    const blockers: string[] = [];

    if (this.submitting()) {
      blockers.push('Procesando registro...');
      return blockers;
    }

    if (!this.selectedPhoto) {
      blockers.push('Foto para credencial');
    }

    const typeCtrl = this.registrationForm.controls.type;
    if (typeCtrl.invalid) {
      blockers.push(this.fieldLabels['type'] ?? 'Tipo de registro');
    }

    const common = this.registrationForm.controls.common.controls;

    for (const key of ['firstName', 'lastName', 'idType', 'birthDate', 'validUntil'] as const) {
      if (common[key].invalid) {
        blockers.push(this.fieldLabels[key] ?? key);
      }
    }

    const idCtrl = common.idNumber;
    if (idCtrl.hasError('duplicateIdentity')) {
      blockers.push('Número de identificación ya registrado');
    } else if (this.identityAvailability() === 'checking') {
      blockers.push('Verificando número de identificación...');
    } else if (idCtrl.hasError('required')) {
      blockers.push('Número de identificación');
    } else if (idCtrl.hasError('digitsOnly')) {
      blockers.push('Número de identificación (solo dígitos)');
    } else if (!isIdentityReadyForLookup(String(idCtrl.value ?? ''))) {
      blockers.push('Número de identificación (mínimo 5 dígitos)');
    } else if (this.identityAvailability() !== 'available') {
      blockers.push('Espere la verificación del número de identificación');
    }

    const emailCtrl = common.institutionalEmail;
    if (emailCtrl.hasError('duplicateEmail')) {
      blockers.push('Correo institucional ya registrado');
    } else if (this.emailAvailability() === 'checking') {
      blockers.push('Verificando correo institucional...');
    } else if (emailCtrl.hasError('required')) {
      blockers.push('Correo institucional');
    } else if (emailCtrl.hasError('email')) {
      blockers.push('Correo institucional con formato válido');
    } else if (!isValidEmailFormat(String(emailCtrl.value ?? ''))) {
      blockers.push('Correo institucional con formato válido');
    } else if (this.emailAvailability() !== 'available') {
      blockers.push('Espere la verificación del correo institucional');
    }

    if (common.phone.invalid) {
      blockers.push('Teléfono (solo dígitos)');
    }

    for (const field of this.activeSchema()?.fields ?? []) {
      const control = this.detailsGroup.controls[field.name];
      if (control?.invalid) {
        blockers.push(field.label);
      }
    }

    return blockers;
  }

  private setupRealtimeValidators(): void {
    const emailCtrl = this.registrationForm.controls.common.controls.institutionalEmail;
    const idCtrl = this.registrationForm.controls.common.controls.idNumber;

    emailCtrl.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap(() => {
          this.emailAvailability.set('idle');
          patchDuplicateError(emailCtrl, 'duplicateEmail', false);
        }),
        filter((value) => {
          const normalized = String(value ?? '').trim().toLowerCase();
          if (normalized && normalized === this.originalEmail()) return false;
          return isValidEmailFormat(value);
        }),
        tap(() => this.emailAvailability.set('checking')),
        switchMap((value) => this.validationService.checkEmailExists(value)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((exists) => {
        this.emailAvailability.set(exists ? 'duplicate' : 'available');
        patchDuplicateError(emailCtrl, 'duplicateEmail', exists);
      });

    idCtrl.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        tap(() => {
          this.identityAvailability.set('idle');
          patchDuplicateError(idCtrl, 'duplicateIdentity', false);
        }),
        filter((value) => {
          const normalized = String(value ?? '').trim();
          if (normalized && normalized === this.originalIdentity()) return false;
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

  private async loadCredentialTypes(): Promise<void> {
    try {
      const types = await firstValueFrom<CredentialTypeApiResponse[]>(
        this.credentialTypeService.list(),
      );
      this.credentialTypes.set(types);
      this.types.set(
        types.map((type) => ({
          value: type.code,
          label: type.name || getCredentialTypeLabel(type.code),
        })),
      );

      const restoredFromApi = await this.tryRestoreDraftFromApi();
      if (!restoredFromApi) {
        const restoredFromAutosave = await this.tryRestoreFormAutosave();
        if (!restoredFromAutosave) {
          const draft = Registration.loadDraft();
          const draftType = draft?.['type'];
          if (draft && typeof draftType === 'string') {
            await this.applyDraft(draft);
          } else {
            const currentType = this.registrationForm.controls.type.value;
            if (!types.some((type) => type.code === currentType) && types[0]) {
              this.registrationForm.controls.type.setValue(types[0].code);
            }
            this.onTypeChange(this.registrationForm.controls.type.value);
          }
        }
      }
    } catch (error) {
      console.error('No se pudieron cargar los tipos de credencial', error);
    }
  }

  private async tryRestoreFormAutosave(): Promise<boolean> {
    const cache = RegistrationService.loadFormAutosave();
    if (!cache || !this.hasMeaningfulFormData(cache)) return false;

    this.isRestoringForm = true;
    try {
      if (cache.emailAvailability) {
        this.emailAvailability.set(cache.emailAvailability);
      }
      if (cache.identityAvailability) {
        this.identityAvailability.set(cache.identityAvailability);
      }

      await this.applyDraft(cache as unknown as Record<string, unknown>);
      if (cache.photoDataUrl) {
        this.restorePhotoFromCache(cache.photoDataUrl);
      }
      return true;
    } finally {
      this.isRestoringForm = false;
    }
  }

  private setupFormAutosave(): void {
    this.registrationForm.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.persistFormCache();
      });
  }

  private hasMeaningfulFormData(
    data: RegistrationFormAutosave | ReturnType<typeof this.registrationForm.getRawValue>,
  ): boolean {
    const common = data.common as Record<string, unknown>;
    const details = (data.details ?? {}) as Record<string, unknown>;

    const hasCommon = [
      common['firstName'],
      common['lastName'],
      common['idNumber'],
      common['institutionalEmail'],
      common['phone'],
      common['idType'],
      common['birthDate'],
      common['validUntil'],
    ].some((value) => String(value ?? '').trim());

    const hasDetails = Object.values(details).some(
      (value) => value !== null && value !== undefined && String(value).trim() !== '',
    );

    return hasCommon || hasDetails;
  }

  private async persistFormCache(): Promise<void> {
    if (this.isRestoringForm || typeof window === 'undefined') return;

    const raw = this.registrationForm.getRawValue();
    if (!this.hasMeaningfulFormData(raw)) {
      RegistrationService.clearFormAutosave();
      return;
    }

    let photoDataUrl = this.cachedPhotoDataUrl;
    if (this.selectedPhoto) {
      try {
        photoDataUrl = await this.fileToDataUrl(this.selectedPhoto);
        if (photoDataUrl.length > 750_000) {
          photoDataUrl = undefined;
        } else {
          this.cachedPhotoDataUrl = photoDataUrl;
        }
      } catch {
        photoDataUrl = this.cachedPhotoDataUrl;
      }
    }

    const cache: RegistrationFormAutosave = {
      type: raw.type,
      common: {
        firstName: raw.common.firstName,
        lastName: raw.common.lastName,
        idType: raw.common.idType,
        idNumber: raw.common.idNumber,
        birthDate: raw.common.birthDate?.toISOString() ?? null,
        validUntil: raw.common.validUntil?.toISOString() ?? null,
        institutionalEmail: raw.common.institutionalEmail,
        phone: raw.common.phone || undefined,
      },
      details: raw.details as Record<string, unknown>,
      photoDataUrl,
      emailAvailability: this.toPersistedAvailability(this.emailAvailability()),
      identityAvailability: this.toPersistedAvailability(this.identityAvailability()),
      savedAt: new Date().toISOString(),
    };

    RegistrationService.saveFormAutosave(cache);
  }

  private toPersistedAvailability(
    status: AvailabilityStatus,
  ): 'available' | 'duplicate' | undefined {
    return status === 'available' || status === 'duplicate' ? status : undefined;
  }

  private persistFormCacheSync(): void {
    if (this.isRestoringForm || typeof window === 'undefined') return;

    const raw = this.registrationForm.getRawValue();
    if (!this.hasMeaningfulFormData(raw)) {
      RegistrationService.clearFormAutosave();
      return;
    }

    const cache: RegistrationFormAutosave = {
      type: raw.type,
      common: {
        firstName: raw.common.firstName,
        lastName: raw.common.lastName,
        idType: raw.common.idType,
        idNumber: raw.common.idNumber,
        birthDate: raw.common.birthDate?.toISOString() ?? null,
        validUntil: raw.common.validUntil?.toISOString() ?? null,
        institutionalEmail: raw.common.institutionalEmail,
        phone: raw.common.phone || undefined,
      },
      details: raw.details as Record<string, unknown>,
      photoDataUrl: this.cachedPhotoDataUrl,
      emailAvailability: this.toPersistedAvailability(this.emailAvailability()),
      identityAvailability: this.toPersistedAvailability(this.identityAvailability()),
      savedAt: new Date().toISOString(),
    };

    RegistrationService.saveFormAutosave(cache);
  }

  private restorePhotoFromCache(dataUrl: string): void {
    const prev = this.photoPreviewUrl();
    if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);

    this.photoPreviewUrl.set(dataUrl);
    this.cachedPhotoDataUrl = dataUrl;
    this.selectedPhoto = this.dataUrlToFile(dataUrl, 'credencial-foto.jpg');
    this.photoRequired.set(false);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  }

  private async tryRestoreDraftFromApi(): Promise<boolean> {
    const draftId = RegistrationService.getDraftCredentialId();
    if (!draftId) return false;

    try {
      const credential = await firstValueFrom(this.registrationService.getCredential(draftId));
      if (String(credential.status ?? '').toUpperCase() !== 'PENDING') {
        RegistrationService.clearDraftStorage();
        return false;
      }
      const formValues = mapCredentialToRegistrationForm(credential);
      await this.applyRegistrationFormValues(formValues, credential);
      return true;
    } catch (error) {
      console.warn('No se pudo restaurar el borrador desde el API, usando fallback local', error);
      return false;
    }
  }

  private async applyDraft(draft: Record<string, unknown>): Promise<void> {
    const draftType = draft['type'];
    if (typeof draftType !== 'string') return;

    const common = draft['common'] as Record<string, unknown> | undefined;
    const details = draft['details'] as Record<string, unknown> | undefined;
    const birthDateVal = common?.['birthDate'];
    const validUntilVal = common?.['validUntil'];
    const legacyFullName = (common?.['fullName'] as string) ?? '';

    const formValues: RegistrationFormValues = {
      type: draftType,
      common: {
        firstName: (common?.['firstName'] as string) ?? legacyFullName,
        lastName: (common?.['lastName'] as string) ?? '',
        idType: (common?.['idType'] as IdType | '') ?? '',
        idNumber: (common?.['idNumber'] as string) ?? '',
        birthDate:
          typeof birthDateVal === 'string' && birthDateVal ? new Date(birthDateVal) : null,
        validUntil:
          typeof validUntilVal === 'string' && validUntilVal ? new Date(validUntilVal) : null,
        institutionalEmail: (common?.['institutionalEmail'] as string) ?? '',
        phone: (common?.['phone'] as string) ?? undefined,
      },
      details: (details ?? {}) as Record<string, unknown>,
    };

    await this.applyRegistrationFormValues(formValues);
  }

  private async applyRegistrationFormValues(
    formValues: RegistrationFormValues,
    credential?: CredentialApiResponse,
  ): Promise<void> {
    const types = this.credentialTypes();
    const resolvedType = types.some((item) => item.code === formValues.type)
      ? formValues.type
      : (types[0]?.code ?? formValues.type);

    this.registrationForm.patchValue({ type: resolvedType }, { emitEvent: false });
    this.onTypeChange(resolvedType);

    this.registrationForm.patchValue(
      {
        common: {
          ...formValues.common,
          idType: formValues.common.idType || '',
        },
      },
      { emitEvent: false },
    );

    if (Object.keys(formValues.details).length > 0) {
      this.detailsInitialValues.set(formValues.details);
    }

    if (credential) {
      this.draftCredentialId.set(credential.id);
      this.originalEmail.set(String(credential.institutionalEmail ?? '').trim().toLowerCase());
      this.originalIdentity.set(String(credential.identityNumber ?? '').trim());

      const email = this.originalEmail();
      if (email && isValidEmailFormat(email)) {
        this.emailAvailability.set('available');
      }

      const identity = this.originalIdentity();
      if (identity && isIdentityReadyForLookup(identity)) {
        this.identityAvailability.set('available');
      }

      if (credential.imagePath) {
        this.photoPreviewUrl.set(getPhotoUrl(credential.imagePath));
      }
    }

    await this.validateRestoredDraft();
  }

  private async validateRestoredDraft(): Promise<void> {
    this.registrationForm.updateValueAndValidity({ emitEvent: false });
    await this.waitNextRender();
    this.detailsGroup.updateValueAndValidity({ emitEvent: false });

    await this.revalidateRestoredAvailability();

    this.markInvalidControlsAsTouched(this.registrationForm.controls.common);
    for (const field of this.activeSchema()?.fields ?? []) {
      const control = this.detailsGroup.controls[field.name];
      if (control?.invalid) {
        control.markAsTouched();
      }
    }
  }

  private async revalidateRestoredAvailability(): Promise<void> {
    const emailCtrl = this.registrationForm.controls.common.controls.institutionalEmail;
    const idCtrl = this.registrationForm.controls.common.controls.idNumber;

    const email = String(emailCtrl.value ?? '').trim();
    const idNumber = String(idCtrl.value ?? '').trim();
    const checks: Promise<void>[] = [];

    if (isValidEmailFormat(email)) {
      const normalizedEmail = email.toLowerCase();
      if (normalizedEmail === this.originalEmail()) {
        this.emailAvailability.set('available');
        patchDuplicateError(emailCtrl, 'duplicateEmail', false);
      } else {
        if (this.emailAvailability() !== 'available') {
          this.emailAvailability.set('checking');
        }
        checks.push(
          firstValueFrom(this.validationService.checkEmailExists(email)).then((exists) => {
            this.emailAvailability.set(exists ? 'duplicate' : 'available');
            patchDuplicateError(emailCtrl, 'duplicateEmail', exists);
          }),
        );
      }
    }

    if (isIdentityReadyForLookup(idNumber)) {
      if (idNumber === this.originalIdentity()) {
        this.identityAvailability.set('available');
        patchDuplicateError(idCtrl, 'duplicateIdentity', false);
      } else {
        if (this.identityAvailability() !== 'available') {
          this.identityAvailability.set('checking');
        }
        checks.push(
          firstValueFrom(this.validationService.checkIdentityExists(idNumber)).then((exists) => {
            this.identityAvailability.set(exists ? 'duplicate' : 'available');
            patchDuplicateError(idCtrl, 'duplicateIdentity', exists);
          }),
        );
      }
    }

    await Promise.all(checks);
  }

  private markInvalidControlsAsTouched(group: FormGroup): void {
    for (const control of Object.values(group.controls)) {
      if (control.invalid) {
        control.markAsTouched();
      }
    }
  }

  ngOnDestroy(): void {
    this.persistFormCacheSync();
    this.stopCameraStream();
    const url = this.photoPreviewUrl();
    if (url) URL.revokeObjectURL(url);
  }

  openCamera(): void {
    const support = getCameraSupportInfo();
    if (support.canUseGetUserMedia) {
      void this.startCameraStream();
      return;
    }
    void this.openNativeCameraPicker(support);
  }

  closeCamera(): void {
    this.stopCameraStream();
    this.showCameraOverlay.set(false);
  }

  private waitNextRender(): Promise<void> {
    return new Promise((resolve) => {
      afterNextRender(() => resolve(), { injector: this.environmentInjector });
    });
  }

  private async openNativeCameraPicker(support = getCameraSupportInfo()): Promise<void> {
    const input = this.cameraInputRef()?.nativeElement;
    if (!input) {
      const alert = getCameraErrorAlert(
        new DOMException('Input de cámara no disponible', 'NotFoundError'),
        support,
      );
      void Swal.fire({
        icon: alert.icon,
        title: alert.title,
        text: alert.text,
        confirmButtonColor: '#0c2e57',
      });
      return;
    }

    // Abrir el selector en el mismo gesto del click; no mostrar modales antes.
    input.value = '';
    input.click();

    if (!support.canUseGetUserMedia) {
      const hint = getNativeCaptureFallbackAlert(support);
      void Swal.fire({
        icon: hint.icon,
        title: hint.title,
        text: hint.text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 7000,
        timerProgressBar: true,
      });
    }
  }

  async startCameraStream(): Promise<void> {
    const support = getCameraSupportInfo();

    try {
      // Solicitar permiso de inmediato, dentro del gesto del usuario (click).
      // Esperar renders antes de getUserMedia hace que Chrome/Safari bloqueen el popup.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.cameraStream = stream;
      this.showCameraOverlay.set(true);
      await this.waitNextRender();

      const video = this.cameraVideoRef()?.nativeElement;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      this.showCameraOverlay.set(false);
      this.stopCameraStream();

      const alert = getCameraErrorAlert(err, support);
      void Swal.fire({
        icon: alert.icon,
        title: alert.title,
        text: alert.text,
        confirmButtonColor: '#0c2e57',
      });
    }
  }

  private stopCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
      this.cameraStream = null;
    }
  }

  capturePhoto(): void {
    const video = this.cameraVideoRef()?.nativeElement;
    const canvas = this.cameraCanvasRef()?.nativeElement;
    if (!video || !canvas || !video.srcObject) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'foto-captura.jpg', { type: 'image/jpeg' });
        this.selectedPhoto = file;
        const prev = this.photoPreviewUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.photoPreviewUrl.set(URL.createObjectURL(blob));
        this.photoRequired.set(false);
        this.cachedPhotoDataUrl = undefined;
        void this.persistFormCache();
        this.closeCamera();
      },
      'image/jpeg',
      0.9,
    );
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
    if (prev) URL.revokeObjectURL(prev);
    this.photoPreviewUrl.set(URL.createObjectURL(file));
    this.photoRequired.set(false);
    this.cachedPhotoDataUrl = undefined;
    void this.persistFormCache();
    input.value = '';
  }

  async onSaveDraft(): Promise<void> {
    if (this.savingDraft()) return;

    const idCtrl = this.registrationForm.controls.common.controls.idNumber;
    idCtrl.markAsTouched();

    const draftBlockers = this.getDraftSaveBlockers();
    if (draftBlockers.length > 0) {
      this.identitySectionExpanded.set(true);
      await Swal.fire({
        icon: 'error',
        title: 'No se puede guardar el borrador',
        text:
          draftBlockers.length === 1
            ? draftBlockers[0]
            : draftBlockers.join('\n'),
        confirmButtonColor: '#163665',
      });
      return;
    }

    const raw = this.registrationForm.getRawValue();
    const idNumber = String(raw.common.idNumber ?? '').trim();

    if (idNumber !== this.originalIdentity()) {
      const identityExists = await firstValueFrom(
        this.validationService.checkIdentityExists(idNumber),
      );
      if (identityExists) {
        patchDuplicateError(idCtrl, 'duplicateIdentity', true);
        this.identityAvailability.set('duplicate');
        this.identitySectionExpanded.set(true);
        await Swal.fire({
          icon: 'error',
          title: 'Identificación ya registrada',
          text: `El número ${idNumber} ya está asociado a otra credencial.`,
          confirmButtonColor: '#163665',
        });
        return;
      }
      this.identityAvailability.set('available');
    }

    const payload: RegistrationPayload = {
      type: raw.type,
      common: raw.common as RegistrationPayload['common'],
      details: raw.details as Record<string, unknown>,
    };

    this.savingDraft.set(true);
    try {
      const saved = await firstValueFrom(
        this.registrationService.saveDraft(payload, this.selectedPhoto),
      );

      this.draftCredentialId.set(saved.id);
      RegistrationService.setDraftCredentialId(saved.id);
      this.originalEmail.set(
        String(saved.institutionalEmail ?? raw.common.institutionalEmail ?? '')
          .trim()
          .toLowerCase(),
      );
      this.originalIdentity.set(
        String(saved.identityNumber ?? raw.common.idNumber ?? '').trim(),
      );

      await Swal.fire({
        icon: 'success',
        title: 'Borrador guardado',
        text: 'Sus datos se han guardado correctamente.',
        confirmButtonColor: '#163665',
      });

      RegistrationService.clearLegacyDraftCache();
      RegistrationService.clearFormAutosave();
      this.clearRegistrationForm({ preserveDraftContext: true });

      await firstValueFrom(this.personalListService.loadAll());
      this.navigationService.navigate('/personal-registrado');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar borrador',
        text: getHttpErrorMessage(err, 'No se pudo guardar el borrador. Intente de nuevo.'),
        confirmButtonColor: '#163665',
      });
    } finally {
      this.savingDraft.set(false);
    }
  }

  private clearRegistrationForm(options?: { preserveDraftContext?: boolean }): void {
    const defaultType =
      this.credentialTypes().find((type) => type.code === 'militar')?.code ??
      this.credentialTypes()[0]?.code ??
      'militar';

    this.registrationForm.reset(
      {
        type: defaultType,
        common: {
          firstName: '',
          lastName: '',
          idType: '',
          idNumber: '',
          birthDate: null,
          validUntil: null,
          institutionalEmail: '',
          phone: '',
        },
        details: {},
      },
      { emitEvent: false },
    );

    Object.keys(this.detailsGroup.controls).forEach((k) => this.detailsGroup.removeControl(k));
    this.detailsGroup.reset({}, { emitEvent: false });
    this.detailsInitialValues.set({});
    this.onTypeChange(defaultType);

    this.selectedPhoto = undefined;
    const prev = this.photoPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.photoPreviewUrl.set(null);
    this.photoRequired.set(false);
    this.emailAvailability.set('idle');
    this.identityAvailability.set('idle');
    this.identitySectionExpanded.set(true);
    this.detailsSectionExpanded.set(true);

    if (!options?.preserveDraftContext) {
      this.draftCredentialId.set(null);
      this.originalEmail.set('');
      this.originalIdentity.set('');
      RegistrationService.clearFormAutosave();
      this.cachedPhotoDataUrl = undefined;
    }
  }

  private resolveSubmitCredentialId(
    email?: string,
    idNumber?: string,
  ): string | undefined {
    const existingId =
      this.draftCredentialId() ?? RegistrationService.getDraftCredentialId() ?? undefined;
    if (!existingId) return undefined;

    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const originalEmail = this.originalEmail();
    const originalIdentity = this.originalIdentity();

    const emailChanged =
      Boolean(originalEmail) && Boolean(normalizedEmail) && normalizedEmail !== originalEmail;
    const identityChanged =
      Boolean(originalIdentity) && Boolean(idNumber) && idNumber !== originalIdentity;

    if (emailChanged || identityChanged) {
      return undefined;
    }

    return existingId;
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    this.registrationForm.markAllAsTouched();
    this.detailsGroup.markAllAsTouched();

    if (!this.selectedPhoto) {
      this.photoRequired.set(true);
      this.identitySectionExpanded.set(true);
    }

    const missing = this.collectMissingFields();
    if (missing.length > 0) {
      this.expandSectionsForMissing(missing);
      const listHtml = missing.map((f) => `<li>${f}</li>`).join('');
      void Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        html: `<p style="margin:0 0 8px">Complete los siguientes campos:</p><ul style="text-align:left;margin:0;padding-left:1.25rem">${listHtml}</ul>`,
        confirmButtonColor: '#163665',
      });
      return;
    }

    const raw = this.registrationForm.getRawValue();
    const email = raw.common.institutionalEmail?.trim();
    const idNumber = raw.common.idNumber?.trim();

    const emailCtrl = this.registrationForm.controls.common.controls.institutionalEmail;
    const idCtrl = this.registrationForm.controls.common.controls.idNumber;

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const isOwnDraftEmail = normalizedEmail === this.originalEmail();
      if (!isOwnDraftEmail) {
        const emailExists = await firstValueFrom(this.validationService.checkEmailExists(email));
        if (emailExists) {
          emailCtrl.markAsTouched();
          patchDuplicateError(emailCtrl, 'duplicateEmail', true);
          this.emailAvailability.set('duplicate');
          void this.showRegistrationAlert(buildDuplicateEmailAlert(email));
          return;
        }
      }
    }

    if (idNumber) {
      const isOwnDraftIdentity = idNumber === this.originalIdentity();
      if (!isOwnDraftIdentity) {
        const identityExists = await firstValueFrom(
          this.validationService.checkIdentityExists(idNumber),
        );
        if (identityExists) {
          idCtrl.markAsTouched();
          patchDuplicateError(idCtrl, 'duplicateIdentity', true);
          this.identityAvailability.set('duplicate');
          void Swal.fire({
            icon: 'error',
            title: 'Identificación ya registrada',
            text: `El número ${idNumber} ya está asociado a otra credencial. Verifique el dato o consulte el personal registrado.`,
            confirmButtonColor: '#163665',
          });
          this.focusIdNumber();
          return;
        }
      }
    }

    const rawDetails = raw.details as Record<string, unknown>;

    const payload: RegistrationPayload = {
      type: raw.type,
      common: raw.common as RegistrationPayload['common'],
      details: rawDetails,
    };

    const existingId = this.resolveSubmitCredentialId(email, idNumber);

    this.submitting.set(true);
    try {
      const created = await firstValueFrom(
        this.registrationService.submitRegistration(payload, this.selectedPhoto, existingId),
      );
      await this.handleRegistrationSuccess(created, raw.common);
    } catch (err) {
      await this.showRegistrationError(err, email);
    } finally {
      this.submitting.set(false);
    }
  }

  private async showRegistrationError(err: unknown, email?: string): Promise<void> {
    let alert = getRegistrationErrorAlert(err, email);

    if (alert.title === 'Error al registrar' && email) {
      const exists = await firstValueFrom(this.validationService.checkEmailExists(email));
      if (exists) {
        alert = buildDuplicateEmailAlert(email);
      }
    }

    await this.showRegistrationAlert(alert);
  }

  private async showRegistrationAlert(alert: {
    icon: 'error' | 'warning';
    title: string;
    text: string;
    focusField?: 'institutionalEmail';
  }): Promise<void> {
    await Swal.fire({
      icon: alert.icon,
      title: alert.title,
      text: alert.text,
      confirmButtonColor: '#163665',
    });
    if (alert.focusField === 'institutionalEmail') {
      this.focusInstitutionalEmail();
    }
  }

  private readonly fieldLabels: Record<string, string> = {
    type: 'Tipo de registro',
    firstName: 'Nombres',
    lastName: 'Apellidos',
    idType: 'Tipo de identificación',
    idNumber: 'Número de identificación',
    birthDate: 'Fecha de nacimiento',
    validUntil: 'Vigencia de la credencial',
    institutionalEmail: 'Correo institucional',
    force: 'Fuerza',
    grades: 'Grado',
    sport: 'Disciplina o deporte',
    course: 'Curso',
  };

  private collectMissingFields(): string[] {
    return this.getSubmitBlockers();
  }

  private expandSectionsForMissing(missing: string[]): void {
    const identityFields = new Set([
      'Tipo de registro',
      'Nombres',
      'Apellidos',
      'Tipo de identificación',
      'Número de identificación',
      'Fecha de nacimiento',
      'Vigencia de la credencial',
      'Correo institucional',
      'Teléfono',
      'Foto para credencial',
    ]);

    if (missing.some((f) => identityFields.has(f))) {
      this.identitySectionExpanded.set(true);
    }

    const dynamicLabels = new Set((this.activeSchema()?.fields ?? []).map((field) => field.label));
    if (missing.some((f) => dynamicLabels.has(f))) {
      this.detailsSectionExpanded.set(true);
    }
  }

  private focusInstitutionalEmail(): void {
    this.focusField('input[formcontrolname="institutionalEmail"]');
  }

  private focusIdNumber(): void {
    this.focusField('input[formcontrolname="idNumber"]');
  }

  private focusField(selector: string): void {
    if (typeof document === 'undefined') return;
    this.identitySectionExpanded.set(true);
    const el = document.querySelector<HTMLInputElement>(selector);
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private async handleRegistrationSuccess(
    created: CredentialApiResponse,
    common: RegistrationPayload['common'],
  ): Promise<void> {
    const institutionalEmail = String(common.institutionalEmail ?? '').trim();
    const newItem: PersonalItemWithExtras = {
      ...mapCredentialToPersonalItem(created),
      emision: this.formatDisplayDate(new Date()),
      validoHasta: this.formatDisplayDate(common.validUntil),
    };
    this.personalListService.addItem(newItem);

    if (typeof window !== 'undefined') {
      RegistrationService.clearDraftStorage();
    }
    this.draftCredentialId.set(null);
    this.originalEmail.set('');
    this.originalIdentity.set('');
    this.clearRegistrationForm();

    await firstValueFrom(this.personalListService.loadAll());
    await this.router.navigate(['/personal-registrado']);

    void Swal.fire({
      title: 'Enviando credencial...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    let emailSent = false;
    let mailErrorMessage: string | undefined;
    try {
      const pdfData = buildCredentialPdfData(
        newItem,
        newItem.photoUrl ? getPhotoUrl(newItem.photoUrl) : undefined,
      );
      const blob = await this.credentialPdfService.generateBlobFromData(
        pdfData,
        this.environmentInjector,
      );
      const nombre = newItem.nombreCompleto;
      await firstValueFrom(
        this.mailService.sendCredentialEmail(institutionalEmail, blob, {
          subject: nombre ? `Tu credencial - ${nombre}` : 'Tu credencial',
        }),
      );
      emailSent = true;
    } catch (err) {
      console.error('Error al enviar credencial por correo:', err);
      mailErrorMessage = getHttpErrorMessage(err, 'mail');
    }

    Swal.close();

    if (emailSent) {
      await Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: `Credencial creada y enviada a ${institutionalEmail}.`,
        confirmButtonColor: '#163665',
      });
      return;
    }

    await Swal.fire({
      icon: 'warning',
      title: 'Registro exitoso',
      text:
        mailErrorMessage ??
        'La credencial se creó correctamente, pero no se pudo enviar el correo. Puede compartirla desde la vista de credencial.',
      confirmButtonColor: '#163665',
    });
  }

  navigateTo(path: string): void {
    this.navigationService.navigate(path);
  }

  private formatDisplayDate(value: Date | string | null | undefined): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
