import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { NavigationService } from '../../core/services/navigation.service';

type RankOption = { value: string; label: string };

// 👇 Tipos de controles (esto elimina los “errores” del template)
type RegistrationFormModel = {
  fullName: string;
  rank: string;
  idNumber: string;
  unit: string;
  birthDate: Date | null;
  admissionDate: Date | null;
  email: string;
};

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
  ],
})
export class Registration {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly navigationService = inject(NavigationService);

  // Si vas a manejar foto desde template
  selectedPhoto?: File;

  readonly ranks: RankOption[] = [
    { value: 'soldado', label: 'Soldado' },
    { value: 'cabo', label: 'Cabo' },
    { value: 'sargento', label: 'Sargento' },
    { value: 'teniente', label: 'Teniente' },
    { value: 'capitan', label: 'Capitán' },
    { value: 'mayor', label: 'Mayor' },
    { value: 'coronel', label: 'Coronel' },
    { value: 'general', label: 'General' },
  ];

  private readonly fieldNames: Record<keyof RegistrationFormModel, string> = {
    fullName: 'Nombre Completo',
    rank: 'Rango Militar',
    idNumber: 'Número de Identificación',
    unit: 'Unidad Asignada',
    birthDate: 'Fecha de Nacimiento',
    admissionDate: 'Fecha de Ingreso',
    email: 'Correo Electrónico',
  };

  // ✅ Form creado de una vez (evita null/undefined en template)
  readonly registrationForm = this.fb.group({
    fullName: this.fb.control('', { validators: [Validators.required] }),
    rank: this.fb.control('', { validators: [Validators.required] }),
    idNumber: this.fb.control('', { validators: [Validators.required] }),
    unit: this.fb.control('', { validators: [Validators.required] }),
    birthDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    admissionDate: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
  });

  // ✅ Getters “cómodos” para el HTML (opcional, pero recomendado)
  get fullNameCtrl() {
    return this.registrationForm.controls.fullName;
  }
  get idNumberCtrl() {
    return this.registrationForm.controls.idNumber;
  }
  get birthDateCtrl() {
    return this.registrationForm.controls.birthDate;
  }
  get admissionDateCtrl() {
    return this.registrationForm.controls.admissionDate;
  }
  get rankCtrl() {
    return this.registrationForm.controls.rank;
  }
  get emailCtrl() {
    return this.registrationForm.controls.email;
  }
  get unitCtrl() {
    return this.registrationForm.controls.unit;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validación simple: tipo y tamaño (5MB)
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

    if (this.registrationForm.valid) {
      await Swal.fire({
        icon: 'success',
        title: 'Registro Exitoso',
        text: 'La identificación digital ha sido generada correctamente.',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#163665',
        showCloseButton: true,
      });

      this.navigationService.navigate('/id-card');
      return;
    }

    const invalidFields = (
      Object.keys(this.registrationForm.controls) as (keyof RegistrationFormModel)[]
    )
      .filter((key) => this.registrationForm.controls[key].invalid)
      .map((key) => this.fieldNames[key] ?? String(key));

    await Swal.fire({
      icon: 'error',
      title: 'Formulario incompleto',
      html: `
        <div style="text-align:left">
          <p>Por favor complete lo siguiente:</p>
          <ul style="margin:8px 0 0 18px">
            ${invalidFields.map((f) => `<li>${this.escapeHtml(f)}</li>`).join('')}
          </ul>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#163665',
    });
  }

  navigateTo(path: string): void {
    this.navigationService.navigate(path);
  }

  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
