import { CommonModule } from '@angular/common';
import {
  Component,
  afterNextRender,
  ElementRef,
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

import { PersonalListService } from '../personal-registrado/data/personal-list.service';
import { mapCredentialToPersonalItem } from '../personal-registrado/models/personal-item.model';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { NavigationService } from '../../core/services/navigation.service';
import { RegistrationService, type RegistrationPayload } from '../../core/services/registration.service';
import { RegistrationSkeleton } from '../../layout/widgets/registration-skeleton/registration-skeleton';

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

    RegistrationSkeleton,
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

  loading = signal(true);
  selectedPhoto?: File;
  photoPreviewUrl = signal<string | null>(null);
  identitySectionExpanded = signal(true);
  detailsSectionExpanded = signal(true);
  showCameraOverlay = signal(false);

  private cameraVideoRef = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo');
  private cameraCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('cameraCanvas');
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
    this.layoutLoading.setLoading(true);
    afterNextRender(() => {
      setTimeout(() => {
        this.loading.set(false);
        this.layoutLoading.setLoading(false);
        this.restoreDraftIfExists();
      }, 600);
    });
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

  async openCamera(): Promise<void> {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    if (isMobile) {
      document.getElementById('reg-camera-input')?.click();
      return;
    }
    await this.startCameraStream();
  }

  closeCamera(): void {
    this.stopCameraStream();
    this.showCameraOverlay.set(false);
  }

  async startCameraStream(): Promise<void> {
    try {
      this.showCameraOverlay.set(true);
      setTimeout(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        this.cameraStream = stream;
        const video = this.cameraVideoRef()?.nativeElement;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      }, 100);
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      void Swal.fire({
        icon: 'error',
        title: 'Cámara no disponible',
        text: 'No se pudo acceder a la cámara. Puedes subir una foto desde tu dispositivo.',
        confirmButtonColor: '#0c2e57',
      });
      this.showCameraOverlay.set(false);
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

  onSubmit(): void {
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.invalid) {
      void Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor revisa los campos marcados.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    const raw = this.registrationForm.getRawValue();
    const rawDetails = raw.details as Record<string, unknown>;

    // Enviamos todos los campos del formulario dinámico.
    // El backend recibirá lo que haya disponible en este momento.
    const payload: RegistrationPayload = {
      type: raw.type,
      common: raw.common as RegistrationPayload['common'],
      details: rawDetails,
    };

    this.registrationService.submitRegistration(payload, this.selectedPhoto).subscribe({
      next: (created) => {
        // Usar la respuesta del API para añadir el ítem a la lista
        const newItem = mapCredentialToPersonalItem(created);
        this.personalListService.addItem(newItem);

        if (typeof window !== 'undefined') {
          localStorage.removeItem(REGISTRATION_DRAFT_KEY);
        }
        this.clearRegistrationForm();
        void Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: 'Credencial creada correctamente.',
          confirmButtonColor: '#163665',
        });
        this.navigationService.navigate('/personal-registrado');
      },
      error: (err) => {
        // El API puede devolver message como string o string[]
        const raw = err?.error?.message;
        const msg = Array.isArray(raw)
          ? raw.join('\n')
          : (raw ?? 'No se pudo completar el registro. Intente de nuevo.');
        void Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          html: `<pre style="text-align:left;font-size:13px;white-space:pre-wrap">${msg}</pre>`,
          confirmButtonColor: '#163665',
        });
      },
    });
  }

  navigateTo(path: string): void {
    this.navigationService.navigate(path);
  }
}
