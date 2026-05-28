import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { InstitutionalHeaderComponent } from '../../shared/components/institutional-header/institutional-header.component';
import type { CredentialData } from './credential-data.types';

export interface CredentialPdfData extends CredentialData {
  photoUrl?: string;
  qrUrl?: string;
}

@Component({
  selector: 'app-credential-view-pdf',
  standalone: true,
  imports: [CommonModule, InstitutionalHeaderComponent],
  template: `
    @if (data) {
      <div class="pdf-doc" [attr.data-pdf]="true">
        <article class="pdf-card">
          <app-institutional-header
            fullWidth
            compactLogo
            [logoUrl]="data.org.logoUrl || '/images/ENAP.png'"
          />

          <div class="pdf-card-body">
          <main class="pdf-content">
            <section class="pdf-info">
              <div class="pdf-info-stack">
              <div class="pdf-photo">
                @if (showPhotoPlaceholder || !photoUrl) {
                  <div class="pdf-photo-placeholder">FOTO</div>
                } @else {
                  <img
                    [src]="photoUrl"
                    [alt]="data.persona.nombreCompleto"
                    class="pdf-photo-img"
                    crossorigin="anonymous"
                  />
                }
              </div>

              <div class="pdf-row">
                <div class="pdf-label">NOMBRE COMPLETO</div>
                <div class="pdf-value">{{ data.persona.nombreCompleto }}</div>
              </div>
              <div class="pdf-row">
                <div class="pdf-label">TIPO DE REGISTRO</div>
                <div class="pdf-value">{{ data.tipoRegistro.nombre }}</div>
              </div>
              <div class="pdf-row">
                <div class="pdf-label">IDENTIFICACIÓN</div>
                <div class="pdf-value">{{ data.persona.identificacion }}</div>
              </div>
              @for (field of documentFields(data); track field.label) {
                <div class="pdf-row">
                  <div class="pdf-label">{{ field.label }}</div>
                  <div class="pdf-value">{{ field.value }}</div>
                </div>
              }
              <div class="pdf-row">
                <div class="pdf-label">FECHA DE NACIMIENTO</div>
                <div class="pdf-value">{{ data.persona.fechaNacimiento || 'NO REGISTRA' }}</div>
              </div>
              @if (data.contacto.correo) {
                <div class="pdf-row">
                  <div class="pdf-label">CORREO INSTITUCIONAL</div>
                  <div class="pdf-value">{{ data.contacto.correo }}</div>
                </div>
              }
              </div>
            </section>

            <aside class="pdf-verify">
              <div class="pdf-qr">
                <img [src]="qrUrl" alt="QR verificación" class="pdf-qr-img" crossorigin="anonymous" />
              </div>
              <h3 class="pdf-verify-title">CÓDIGO DE VERIFICACIÓN</h3>
              <div class="pdf-verify-accent"></div>
              <p class="pdf-hash">
                <span class="pdf-hash-label">SHA256:</span>
                <span class="pdf-hash-value">{{ data.verificacion.sha256 }}</span>
              </p>
              <div class="pdf-scan-note">
                Escanee el código QR para verificar la autenticidad del documento en el sistema oficial de la institución.
              </div>
            </aside>
          </main>
          </div>

          <section class="pdf-bottom">
            <div class="pdf-bottom-item">
              <b>FECHA EMISIÓN</b>
              <span>{{ data.vigencia.emision }}</span>
            </div>
            <div class="pdf-bottom-item">
              <b>VÁLIDO HASTA</b>
              <span>{{ data.vigencia.validoHasta }}</span>
            </div>
          </section>
        </article>
      </div>
    }
  `,
  styles: [`
    .pdf-doc {
      width: 210mm;
      height: 297mm;
      padding: 0;
      background: #0c2e57;
      box-sizing: border-box;
      color: #001d4f;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
      border-radius: 0;
    }

    .pdf-card {
      width: 100%;
      height: 100%;
      min-height: 297mm;
      background: #0c2e57;
      border-radius: 0;
      border: none;
      padding: 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
    }

    .pdf-card app-institutional-header {
      flex-shrink: 0;
      width: 100%;
      overflow: visible;
      position: relative;
      z-index: 10;
    }

    .pdf-card-body {
      flex: 1;
      min-height: 0;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
      z-index: 1;
    }

    .pdf-content {
      flex: 1 1 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      padding: 69px 32px 12px;
      min-height: 0;
      box-sizing: border-box;
      overflow: visible;
      align-items: start;
    }

    .pdf-info {
      min-width: 0;
      padding-right: 24px;
      padding-bottom: 4px;
      border-right: 1px solid #ddd;
      box-sizing: border-box;
      overflow: visible;
    }

    .pdf-info-stack {
      width: 220px;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    .pdf-photo {
      width: 100%;
      height: 220px;
      margin: 0 0 8px;
      padding: 10px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #fff;
      box-shadow: 0 4px 14px rgba(0, 29, 79, 0.08);
      box-sizing: border-box;
    }

    .pdf-photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }

    .pdf-photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef0f3;
      color: #888;
      font-weight: 700;
      letter-spacing: 0.14em;
      font-size: 14px;
    }

    .pdf-row {
      padding: 8px 0;
      box-sizing: border-box;
    }

    .pdf-label {
      font-size: 13px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1.2;
    }

    .pdf-value {
      margin-top: 4px;
      font-size: 16px;
      font-weight: bold;
      color: #001d4f;
      line-height: 1.2;
      text-transform: uppercase;
      word-break: break-word;
    }

    .pdf-verify {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
    }

    .pdf-qr {
      width: 220px;
      padding: 10px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 29, 79, 0.08);
      box-sizing: border-box;
    }

    .pdf-qr-img {
      width: 100%;
      height: auto;
      display: block;
    }

    .pdf-verify-title {
      margin: 18px 0 0;
      font-size: 15px;
      font-weight: bold;
      color: #001d4f;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .pdf-verify-accent {
      width: 48px;
      height: 3px;
      margin: 10px auto 0;
      background: #c5a059;
      border-radius: 2px;
    }

    .pdf-hash {
      margin: 12px 0 0;
      width: 100%;
      text-align: center;
      padding: 0 8px;
      box-sizing: border-box;
    }

    .pdf-hash-label {
      display: block;
      font-size: 11px;
      color: #555;
      font-weight: 600;
      text-transform: uppercase;
    }

    .pdf-hash-value {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      font-weight: 700;
      color: #001d4f;
      line-height: 1.35;
      word-break: break-all;
      text-transform: uppercase;
    }

    .pdf-scan-note {
      margin-top: 18px;
      width: 100%;
      padding: 12px 14px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      line-height: 1.4;
      font-weight: 600;
      text-align: center;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .pdf-bottom {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 120px;
      padding: 20px 28px;
      min-height: 72px;
      background: #0c2e57;
      border-top: 3px solid #e9d3b3;
      flex-shrink: 0;
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
    }

    .pdf-bottom-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      color: #ffffff;
      text-transform: uppercase;
      text-align: center;
      align-items: center;
    }

    .pdf-bottom-item b {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: 0.04em;
      font-weight: 700;
    }

    .pdf-bottom-item span {
      font-weight: bold;
      color: #ffffff;
      word-break: break-all;
      font-size: 13px;
      line-height: 1.3;
    }
  `],
})
export class CredentialViewPdfComponent {
  @Input() data: CredentialPdfData | null = null;
  @Input() photoUrl = '';
  @Input() qrUrl = '';
  @Input() showPhotoPlaceholder = false;

  documentFields(data: CredentialPdfData) {
    const skippedLabels = new Set([
      'NOMBRE COMPLETO',
      'APELLIDOS / NOMBRES',
      'TIPO DE REGISTRO',
      'FECHA DE NACIMIENTO',
      'FECHA DE EXPEDICIÓN',
      'VÁLIDO HASTA',
      'IDENTIFICACIÓN',
      'NÚMERO DE IDENTIFICACIÓN',
      'CORREO INSTITUCIONAL',
    ]);

    return [...data.camposPrincipales, ...data.camposSecundarios].filter(
      (field) => !skippedLabels.has(field.label.toUpperCase()),
    );
  }
}
