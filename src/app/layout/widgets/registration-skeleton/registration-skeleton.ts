import { Component } from '@angular/core';

@Component({
  selector: 'app-registration-skeleton',
  standalone: true,
  template: `
    <div class="reg-skeleton" role="status" aria-label="Cargando formulario de registro">
      <div class="reg-skeleton__overlay"></div>

      <div class="reg-skeleton__wrap">
        <!-- Encabezado -->
        <div class="reg-skeleton__heading">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
        </div>

        <!-- Card -->
        <div class="reg-skeleton__panel">
          <div class="reg-skeleton__grid">
            <!-- Columna izquierda -->
            <div class="reg-skeleton__col">
              <div class="reg-skeleton__section">
                <div class="skeleton skeleton-section-title"></div>
              </div>
              <div class="reg-skeleton__dropzone">
                <div class="skeleton skeleton-dropzone-icon"></div>
                <div class="skeleton skeleton-dropzone-line"></div>
                <div class="skeleton skeleton-dropzone-small"></div>
              </div>
              @for (i of [1, 2, 3]; track i) {
                <div class="reg-skeleton__field">
                  <div class="skeleton skeleton-label"></div>
                  <div class="skeleton skeleton-input"></div>
                </div>
              }
            </div>

            <!-- Columna derecha -->
            <div class="reg-skeleton__col">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <div class="reg-skeleton__field">
                  <div class="skeleton skeleton-label"></div>
                  <div class="skeleton skeleton-input"></div>
                </div>
              }
            </div>
          </div>

          <!-- Botones -->
          <div class="reg-skeleton__actions">
            <div class="skeleton skeleton-btn"></div>
            <div class="skeleton skeleton-btn-primary"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .reg-skeleton {
      min-height: 100vh;
      position: relative;
      padding: clamp(18px, 3vw, 34px) clamp(12px, 2vw, 18px) 44px;
    }
    .reg-skeleton__overlay {
      position: absolute;
      inset: 0;
      background: rgba(245, 246, 248, 0.92);
    }
    .reg-skeleton__wrap {
      position: relative;
      z-index: 1;
      width: min(1100px, 100%);
      margin: 0 auto;
    }
    .reg-skeleton__heading {
      padding: 6px 6px 18px;
    }
    .skeleton-title {
      height: 2rem;
      width: 280px;
      margin-bottom: 0.5rem;
    }
    .skeleton-subtitle {
      height: 1rem;
      width: 420px;
    }
    .reg-skeleton__panel {
      background: #fff;
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 14px;
      padding: clamp(12px, 2vw, 18px);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
    }
    .reg-skeleton__grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: clamp(12px, 2vw, 18px);
    }
    .reg-skeleton__col {
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 12px;
      padding: clamp(12px, 2vw, 16px);
      background: #fbfbfd;
    }
    .reg-skeleton__section {
      margin-bottom: 12px;
    }
    .skeleton-section-title {
      height: 1.25rem;
      width: 140px;
    }
    .reg-skeleton__dropzone {
      border: 2px dashed rgba(17, 24, 39, 0.12);
      border-radius: 12px;
      background: rgba(238, 240, 243, 0.55);
      padding: clamp(14px, 2.2vw, 22px);
      text-align: center;
      margin-bottom: 16px;
    }
    .skeleton-dropzone-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 8px;
      border-radius: 8px;
    }
    .skeleton-dropzone-line {
      height: 1rem;
      width: 80%;
      margin: 0 auto 6px;
    }
    .skeleton-dropzone-small {
      height: 0.75rem;
      width: 60%;
      margin: 0 auto;
    }
    .reg-skeleton__field {
      margin: 14px 0 8px;
    }
    .skeleton-label {
      height: 1rem;
      width: 60%;
      margin-bottom: 8px;
    }
    .skeleton-input {
      height: 56px;
      width: 100%;
    }
    .reg-skeleton__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 18px;
      margin-top: 8px;
    }
    .skeleton-btn {
      height: 42px;
      width: 100px;
    }
    .skeleton-btn-primary {
      height: 42px;
      width: 180px;
    }
    @media (max-width: 960px) {
      .reg-skeleton__grid {
        grid-template-columns: 1fr;
      }
      .reg-skeleton__col {
        background: #fff;
      }
      .reg-skeleton__actions {
        flex-direction: row;
        justify-content: stretch;
      }
    }
    @media (max-width: 520px) {
      .skeleton-title {
        width: 200px;
      }
      .skeleton-subtitle {
        width: 280px;
      }
    }
  `,
})
export class RegistrationSkeleton {}
