import { CommonModule } from '@angular/common';
import { Component, afterNextRender, inject, signal } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { NavigationService } from '../../core/services/navigation.service';
import { RegistrationSkeleton } from '../../layout/widgets/registration-skeleton/registration-skeleton';

import { InterEscuelas } from './components/forms/inter-escuelas/inter-escuelas';
import { Militar } from './components/forms/militar/militar';

type RegistrationType = 'militar' | 'civil' | 'inter-escuelas';
type IdType = 'cc' | 'ti' | 'ce' | 'pasaporte';

type IdTypeOption = { value: IdType; label: string };

@Component({
  selector: 'app-registration',
  standalone: true,
  templateUrl: './registration.html',
  styleUrls: ['./registration.scss'],
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
    Militar
  ],
})
export class Registration {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly navigationService = inject(NavigationService);
  private readonly layoutLoading = inject(LayoutLoadingService);

  loading = signal(true);
  selectedPhoto?: File;

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
    type: this.fb.control<RegistrationType>('inter-escuelas', {
      validators: [Validators.required],
    }),

    common: this.fb.group({
      fullName: this.fb.control('', { validators: [Validators.required] }),
      idType: this.fb.control<IdType | ''>('', { validators: [Validators.required] }),
      idNumber: this.fb.control('', { validators: [Validators.required] }),
      birthDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    }),

    details: this.fb.group({}),
  });

  get detailsGroup(): FormGroup {
    return this.registrationForm.controls.details as FormGroup;
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
      }, 600);
    });
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
  }

  async onSubmit(): Promise<void> {
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.invalid) {
      await Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor revisa los campos marcados.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    const payload = this.registrationForm.getRawValue();
    console.log('payload', payload);

    await Swal.fire({
      icon: 'success',
      title: 'Registro Exitoso',
      text: 'La identificación digital ha sido generada correctamente.',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#163665',
      showCloseButton: true,
    });

    this.navigationService.navigate('/id-card');
  }

  navigateTo(path: string): void {
    this.navigationService.navigate(path);
  }
}
