import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute } from '@angular/router';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { VerificationService } from '../../core/services/verification.service';
import {
  getCredentialStatusBadgeClass,
  getCredentialStatusLabel,
} from '../../shared/utils/credential-status.utils';
import { resolvePublicVerifyPhotoUrl, onCredentialPhotoError } from '../../shared/utils/url.utils';
import {
  mapVerificationResponse,
  type VerificationViewModel,
} from './verification.mapper';
import type { VerificationOutcome } from './verification.model';

@Component({
  selector: 'app-verification',
  imports: [
    CommonModule,
    DatePipe,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './verification.html',
  styleUrl: './verification.scss',
})
export class Verification {
  private readonly route = inject(ActivatedRoute);
  private readonly verificationService = inject(VerificationService);

  readonly loadError = signal<string | null>(null);
  readonly viewModel = signal<VerificationViewModel | null>(null);
  readonly loading = signal(true);

  readonly credential = computed(() => this.viewModel()?.credential ?? null);
  readonly outcome = computed(() => this.viewModel()?.outcome ?? null);
  readonly message = computed(() => this.viewModel()?.message ?? '');
  readonly isValid = computed(() => this.viewModel()?.valid ?? false);
  readonly checkedAt = computed(() => this.viewModel()?.checkedAt ?? null);

  readonly photoUrl = computed(() =>
    resolvePublicVerifyPhotoUrl(this.viewModel()?.photoFilename),
  );

  readonly onPhotoError = onCredentialPhotoError;

  readonly statusIcon = computed(() => {
    const current = this.outcome();
    return statusIconFor(current);
  });

  readonly statusClass = computed(() => {
    const current = this.outcome();
    return statusClassFor(current);
  });

  readonly logoUrl = '/images/ENAP.png';

  readonly getCredentialStatusBadgeClass = getCredentialStatusBadgeClass;
  readonly getCredentialStatusLabel = getCredentialStatusLabel;

  outcomeLabel(outcome: VerificationOutcome): string {
    switch (outcome) {
      case 'PENDING':
        return 'Credencial pendiente';
      case 'EXPIRED':
        return 'Credencial expirada';
      case 'REVOKED':
        return 'Credencial revocada';
      case 'SUSPENDED':
        return 'Credencial suspendida';
      case 'NOT_FOUND':
        return 'Credencial no encontrada';
      default:
        return 'Credencial no válida';
    }
  }

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([params, query]) => {
          const identityNumber = params.get('identityNumber')?.trim() ?? '';
          const type = query.get('type')?.trim() ?? '';
          this.loading.set(true);
          this.loadError.set(null);
          this.viewModel.set(null);

          if (!identityNumber || !type) {
            this.loading.set(false);
            this.loadError.set(
              'El enlace de verificación no es válido. Escanee el código QR de la credencial.',
            );
            return of(null);
          }

          return this.verificationService.verify(identityNumber, type).pipe(
            map((response) => mapVerificationResponse(response)),
            catchError(() => {
              this.loadError.set(
                'No fue posible consultar la credencial. Intente nuevamente en unos momentos.',
              );
              return of(null);
            }),
          );
        }),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result !== null) {
          this.viewModel.set(result);
        }
      });
  }
}

function statusIconFor(outcome: VerificationOutcome | null): string {
  switch (outcome) {
    case 'VALID':
      return 'verified';
    case 'PENDING':
      return 'schedule';
    case 'EXPIRED':
      return 'event_busy';
    case 'REVOKED':
    case 'SUSPENDED':
      return 'block';
    default:
      return 'error_outline';
  }
}

function statusClassFor(outcome: VerificationOutcome | null): string {
  switch (outcome) {
    case 'VALID':
      return 'verify-status--valid';
    case 'PENDING':
      return 'verify-status--pending';
    default:
      return 'verify-status--invalid';
  }
}
