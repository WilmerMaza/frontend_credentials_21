import { CommonModule } from '@angular/common';
import {
  Component,
  afterNextRender,
  ElementRef,
  EnvironmentInjector,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { firstValueFrom } from 'rxjs';
import { PersonalListService } from '../personal-registrado/data/personal-list.service';
import {
  mapCredentialToPersonalItem,
  type CredentialApiResponse,
} from '../personal-registrado/models/personal-item.model';
import { RegistrationService, type RegistrationPayload } from '../../core/services/registration.service';
import { CredentialPdfService } from '../../core/services/credential-pdf.service';
import { MailService } from '../../core/services/mail.service';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { NavigationService } from '../../core/services/navigation.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { buildCredentialPdfData } from '../credential-view/credential-mapper';
import { getPhotoUrl } from '../../shared/utils/url.utils';
import { getHttpErrorMessage } from '../../shared/utils/http-error.utils';
import {
  buildDuplicateEmailAlert,
  getRegistrationErrorAlert,
} from '../../shared/utils/registration-error.utils';

import { InterEscuelas } from './components/forms/inter-escuelas/inter-escuelas';
import { Militar } from './components/forms/militar/militar';

const REGISTRATION_DRAFT_KEY = 'registration_draft';

type RegistrationType = 'militar' | 'civil' | 'inter-escuelas';
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
    InterEscuelas,
    Militar,
  ],
})
export class Registration implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly navigationService = inject(NavigationService);
  private readonly layoutLoading = inject(LayoutLoadingService);
  private readonly registrationService = inject(RegistrationService);
  private readonly personalListService = inject(PersonalListService);
  private readonly credentialPdfService = inject(CredentialPdfService);
  private readonly mailService = inject(MailService);
  private readonly environmentInjector = inject(EnvironmentInjector);

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
  selectedPhoto?: File;
  photoPreviewUrl = signal<string | null>(null);
  identitySectionExpanded = signal(true);
  detailsSectionExpanded = signal(true);
  showCameraOverlay = signal(false);

  private cameraVideoRef = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo');
  private cameraCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas');
  private cameraInputRef = viewChild<ElementRef<HTMLInputElement>>('cameraInput');
  private cameraStream: MediaStream | null = null;

  readonly types: Array<{ value: RegistrationType; label: string }> = [
    { value: 'militar', label: 'Personal Militar' },
    { value: 'civil', label: 'Personal Civil' },
    { value: 'inter-escuelas', label: 'Inter-escuelas' },
  ];

  readonly idTypes: IdTypeOption[] = [
    { value: 'cc', label: 'Cédula de ciudadanía (CC)' },
    { value: 'ti', label: 'Tarjeta de identidad (TI)' },
    { value: 'ce', label: 'Cédula de extranjería (CE)' },
    { value: 'pasaporte', label: 'Pasaporte' },
  ];

  // ✅ Form: type + common + details
  readonly registrationForm = this.fb.group({
    type: this.fb.control<RegistrationType>('militar', {
      validators: [Validators.required],
    }),

    common: this.fb.group({
      fullName:           this.fb.control('', { validators: [Validators.required] }),
      idType:             this.fb.control<IdType | ''>('', { validators: [Validators.required] }),
      idNumber:           this.fb.control('', { validators: [Validators.required] }),
      birthDate:          this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      institutionalEmail: this.fb.control('', { validators: [Validators.required, Validators.email] }),
      phone:              this.fb.control('', { validators: [] }),
    }),

    details: this.fb.group({}),
  });

  get detailsGroup(): FormGroup {
    return this.registrationForm.controls.details as FormGroup;
  }

  getTypeLabel(): string {
    const v = this.registrationForm.controls.type.value;
    return this.types.find((t) => t.value === v)?.label ?? v ?? '';
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
  }

  constructor() {
    this.layoutLoading.setLoading(false);
    this.restoreDraftIfExists();
  }

  private restoreDraftIfExists(): void {
    const draft = Registration.loadDraft();
    const draftType = draft?.['type'];
    if (!draft || typeof draftType !== 'string') return;

    const type = draftType as RegistrationType;
    const common = draft['common'] as Record<string, unknown> | undefined;
    const details = draft['details'] as Record<string, unknown> | undefined;

    this.registrationForm.patchValue({ type });
    this.onTypeChange(type);

    if (common) {
      const birthDateVal = common['birthDate'];
      const birthDate =
        typeof birthDateVal === 'string' && birthDateVal ? new Date(birthDateVal) : null;
      this.registrationForm.patchValue({
        common: {
          fullName: (common['fullName'] as string) ?? '',
          idType: (common['idType'] as IdType | '') ?? '',
          idNumber: (common['idNumber'] as string) ?? '',
          birthDate,
        },
      });
    }

    if (details && Object.keys(details).length > 0) {
      setTimeout(() => {
        this.detailsGroup.patchValue(details);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.stopCameraStream();
    const url = this.photoPreviewUrl();
    if (url) URL.revokeObjectURL(url);
  }

  openCamera(): void {
    if (this.canUseMediaDevices()) {
      void this.startCameraStream();
      return;
    }
    void this.openNativeCameraPicker();
  }

  closeCamera(): void {
    this.stopCameraStream();
    this.showCameraOverlay.set(false);
  }

  private canUseMediaDevices(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      typeof navigator.mediaDevices?.getUserMedia === 'function'
    );
  }

  private waitNextRender(): Promise<void> {
    return new Promise((resolve) => {
      afterNextRender(() => resolve(), { injector: this.environmentInjector });
    });
  }

  private async openNativeCameraPicker(): Promise<void> {
    if (!this.identitySectionExpanded()) {
      this.identitySectionExpanded.set(true);
      await this.waitNextRender();
    }

    const input = this.cameraInputRef()?.nativeElement;
    if (!input) {
      void Swal.fire({
        icon: 'warning',
        title: 'No se pudo abrir la cámara',
        text: 'Usa "Subir archivo" o abre la app con HTTPS para usar la cámara en el navegador.',
        confirmButtonColor: '#0c2e57',
      });
      return;
    }

    input.value = '';
    input.click();
  }

  async startCameraStream(): Promise<void> {
    this.showCameraOverlay.set(true);

    try {
      await this.waitNextRender();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      this.cameraStream = stream;
      const video = this.cameraVideoRef()?.nativeElement;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      this.showCameraOverlay.set(false);
      this.stopCameraStream();

      const input = this.cameraInputRef()?.nativeElement;
      if (input) {
        input.value = '';
        input.click();
        return;
      }

      void Swal.fire({
        icon: 'error',
        title: 'Cámara no disponible',
        text: 'No se pudo acceder a la cámara. Puedes subir una foto desde tu dispositivo.',
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
    input.value = '';
  }

  async onSaveDraft(): Promise<void> {
    const raw = this.registrationForm.getRawValue();
    const birthDate = raw.common.birthDate;
    const draft = {
      type: raw.type,
      common: {
        ...raw.common,
        birthDate:
          birthDate != null && typeof birthDate === 'object' && 'toISOString' in birthDate
            ? (birthDate as Date).toISOString()
            : birthDate,
      },
      details: raw.details as Record<string, unknown>,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
    }
    this.clearRegistrationForm();
    await Swal.fire({
      icon: 'success',
      title: 'Borrador guardado',
      text: 'Sus datos se han guardado correctamente.',
      confirmButtonColor: '#163665',
    });
  }

  private clearRegistrationForm(): void {
    this.registrationForm.reset({
      type: 'militar',
      common: {
        fullName: '',
        idType: '',
        idNumber: '',
        birthDate: null,
        institutionalEmail: '',
        phone: '',
      },
      details: {},
    });
    Object.keys(this.detailsGroup.controls).forEach((k) => this.detailsGroup.removeControl(k));
    this.detailsGroup.reset();
    this.selectedPhoto = undefined;
    const prev = this.photoPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.photoPreviewUrl.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;

    this.registrationForm.markAllAsTouched();
    this.detailsGroup.markAllAsTouched();

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

    if (email) {
      const exists = await firstValueFrom(this.personalListService.checkEmailExists(email));
      if (exists) {
        void this.showRegistrationAlert(buildDuplicateEmailAlert(email));
        return;
      }
    }

    const rawDetails = raw.details as Record<string, unknown>;

    const payload: RegistrationPayload = {
      type: raw.type,
      common: raw.common as RegistrationPayload['common'],
      details: rawDetails,
    };

    this.submitting.set(true);
    this.registrationService.submitRegistration(payload, this.selectedPhoto).subscribe({
      next: (created) => {
        void this.handleRegistrationSuccess(created, raw.common.institutionalEmail);
      },
      error: (err) => {
        void this.showRegistrationError(err, email);
      },
      complete: () => this.submitting.set(false),
    });
  }

  private async showRegistrationError(err: unknown, email?: string): Promise<void> {
    let alert = getRegistrationErrorAlert(err, email);

    if (alert.title === 'Error al registrar' && email) {
      const exists = await firstValueFrom(this.personalListService.checkEmailExists(email));
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
    fullName: 'Nombre completo',
    idType: 'Tipo de identificación',
    idNumber: 'Número de identificación',
    birthDate: 'Fecha de nacimiento',
    institutionalEmail: 'Correo institucional',
    force: 'Fuerza',
    grades: 'Grado',
    sport: 'Disciplina o deporte',
    course: 'Curso',
  };

  private collectMissingFields(): string[] {
    const missing: string[] = [];

    const typeCtrl = this.registrationForm.controls.type;
    if (typeCtrl.invalid) {
      missing.push(this.fieldLabels['type'] ?? 'Tipo de registro');
    }

    const common = this.registrationForm.controls.common;
    for (const [key, control] of Object.entries(common.controls)) {
      if (control.invalid) {
        missing.push(this.fieldLabels[key] ?? key);
      }
    }

    for (const [key, control] of Object.entries(this.detailsGroup.controls)) {
      if (control.invalid) {
        missing.push(this.fieldLabels[key] ?? key);
      }
    }

    if (!this.selectedPhoto) {
      missing.push('Foto para credencial');
    }

    return missing;
  }

  private expandSectionsForMissing(missing: string[]): void {
    const identityFields = new Set([
      'Tipo de registro',
      'Nombre completo',
      'Tipo de identificación',
      'Número de identificación',
      'Fecha de nacimiento',
      'Correo institucional',
      'Foto para credencial',
    ]);

    if (missing.some((f) => identityFields.has(f))) {
      this.identitySectionExpanded.set(true);
    }

    const detailsFields = new Set(['Fuerza', 'Grado', 'Disciplina o deporte', 'Curso']);
    if (missing.some((f) => detailsFields.has(f))) {
      this.detailsSectionExpanded.set(true);
    }
  }

  private focusInstitutionalEmail(): void {
    if (typeof document === 'undefined') return;
    this.identitySectionExpanded.set(true);
    const el = document.querySelector<HTMLInputElement>(
      'input[formcontrolname="institutionalEmail"]',
    );
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private async handleRegistrationSuccess(
    created: CredentialApiResponse,
    institutionalEmail: string,
  ): Promise<void> {
    const newItem = mapCredentialToPersonalItem(created);
    this.personalListService.addItem(newItem);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(REGISTRATION_DRAFT_KEY);
    }
    this.clearRegistrationForm();

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
      void Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: `Credencial creada y enviada a ${institutionalEmail}.`,
        confirmButtonColor: '#163665',
      });
    } else {
      void Swal.fire({
        icon: 'warning',
        title: 'Registro exitoso',
        text:
          mailErrorMessage ??
          'La credencial se creó correctamente, pero no se pudo enviar el correo. Puede compartirla desde la vista de credencial.',
        confirmButtonColor: '#163665',
      });
    }

    this.navigationService.navigate('/personal-registrado');
  }

  navigateTo(path: string): void {
    this.navigationService.navigate(path);
  }
}
