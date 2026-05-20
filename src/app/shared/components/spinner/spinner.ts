import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SpinnerService } from '../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="spinner-overlay">
        <div class="loader-container" role="status" aria-live="polite" aria-busy="true">
          <div class="radar-loader">
            <div class="ring outer"></div>
            <div class="ring middle"></div>
            <div class="ring inner"></div>
            <div class="pulse"></div>
            <div class="core">
              <svg viewBox="0 0 24 24" class="logo-icon">
                <path fill="currentColor" d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
              </svg>
            </div>
          </div>
          <div class="loading-content">
            <span class="label">Procesando</span>
            <div class="dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
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
