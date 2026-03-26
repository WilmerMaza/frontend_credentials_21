import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = null;

    const { identifier, password } = this.form.value;

    this.loginService.login({ email: identifier, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.resolveError(err);
      },
    });
  }

  onForgot(): void {
    this.router.navigate(['/forgot-password']);
  }

  onRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  private resolveError(err: any): string {
    const status = err?.status;
    if (status === 401) return 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
    if (status === 429) return 'Demasiados intentos. Intenta de nuevo más tarde.';
    if (status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    return err?.error?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
