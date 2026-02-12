import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="overlay">
        <div class="panel" role="status" aria-live="polite" aria-busy="true">
          <div class="sports-spinner">
            <span class="sport">⚽</span>
            <span class="sport">🏀</span>
            <span class="sport">🎾</span>
            <span class="sport">🏐</span>
          </div>
          <span class="label">Cargando…</span>
        </div>
      </div>
    }
  `,
  styleUrl: './spinner.scss',
})
export class Spinner {
  private spinner = inject(SpinnerService);
  loading = this.spinner.isLoading; // signal
}
