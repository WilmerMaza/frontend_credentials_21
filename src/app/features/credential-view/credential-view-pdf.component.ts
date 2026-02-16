import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { CredentialData } from './credential-data.types';

export interface CredentialPdfData extends CredentialData {
  photoUrl?: string;
  qrUrl?: string;
}

@Component({
  selector: 'app-credential-view-pdf',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (data) {
    <div class="pdf-doc" [attr.data-pdf]="true">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-header-brand">
          <div class="pdf-header-emblem">
            <img [src]="data.org.logoUrl || '/images/ENAP.png'" [alt]="data.org.nombre" class="pdf-emblem-img" crossorigin="anonymous" />
          </div>
          <div class="pdf-header-text">
            <div class="pdf-header-title">{{ data.org.nombre }}</div>
            <div class="pdf-header-sub">{{ data.org.pais }} – {{ data.org.dependencia }}</div>
          </div>
        </div>
        <div class="pdf-header-right">
          <div class="pdf-header-id">{{ data.doc.numeroOficial }}</div>
          @if (data.verificacion.verificado) {
            <span class="pdf-header-verified">VERIFICADO</span>
          }
        </div>
      </div>

      <!-- Título del documento -->
      <div class="pdf-doc-title">
        <h2>{{ data.doc.titulo }}</h2>
        <p>{{ data.doc.subtitulo }}</p>
      </div>

      <!-- Cuerpo tarjeta -->
      <div class="pdf-card-body">
        <div class="pdf-main">
          <aside class="pdf-photo-col">
            <div class="pdf-photo-frame">
              @if (showPhotoPlaceholder || !photoUrl) {
                <div class="pdf-photo-placeholder">FOTO</div>
              } @else {
                <img [src]="photoUrl" [alt]="data.persona.nombreCompleto" class="pdf-photo-img" crossorigin="anonymous" />
              }
            </div>
            <div class="pdf-pill" [class.pdf-pill--active]="data.militar.estado === 'ACTIVO'" [class.pdf-pill--warn]="data.militar.estado === 'PENDIENTE'" [class.pdf-pill--off]="data.militar.estado === 'INACTIVO'">
              {{ data.militar.estado }}
            </div>
          </aside>

          <section class="pdf-info-col">
            <div class="pdf-block">
              <div class="pdf-label">NOMBRE COMPLETO</div>
              <div class="pdf-value pdf-value--xl">{{ data.persona.nombreCompleto }}</div>
            </div>
            <div class="pdf-kv">
              <div class="pdf-k">RANGO</div>
              <div class="pdf-v">{{ data.militar.rango }}</div>
            </div>
            <div class="pdf-kv">
              <div class="pdf-k">UNIDAD</div>
              <div class="pdf-v">{{ data.militar.unidad }}</div>
            </div>
            <div class="pdf-kv">
              <div class="pdf-k">FECHA DE NACIMIENTO</div>
              <div class="pdf-v">{{ data.persona.fechaNacimiento }}</div>
            </div>
            <div class="pdf-kv">
              <div class="pdf-k">FECHA DE INGRESO</div>
              <div class="pdf-v">{{ data.militar.fechaIngreso }}</div>
            </div>
            @if (data.militar.aniosServicio != null) {
            <div class="pdf-kv">
              <div class="pdf-k">AÑOS DE SERVICIO</div>
              <div class="pdf-v">{{ data.militar.aniosServicio }}</div>
            </div>
            }
            <div class="pdf-kv pdf-kv--wide">
              <div class="pdf-k">CORREO INSTITUCIONAL</div>
              <div class="pdf-v">{{ data.contacto.correo }}</div>
            </div>
          </section>

          <aside class="pdf-qr-col">
            <div class="pdf-qr-wrap">
              <div class="pdf-qr-frame">
                <img [src]="qrUrl" alt="QR verificación" class="pdf-qr-img" crossorigin="anonymous" />
              </div>
              <div class="pdf-qr-caption">CÓDIGO DE VERIFICACIÓN</div>
              <div class="pdf-hash">
                <span class="pdf-hash-k">SHA256:</span>
                <span class="pdf-hash-v">{{ data.verificacion.sha256 }}</span>
              </div>
            </div>
          </aside>
        </div>

        <div class="pdf-card-footer">
          Emisión: {{ data.vigencia.emision }} • Válido hasta: {{ data.vigencia.validoHasta }}
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .pdf-doc {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      background: #fff;
      font-family: Inter, system-ui, Arial, sans-serif;
      font-size: 11px;
      color: #1f2937;
      box-sizing: border-box;
    }

    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #0d2847 100%);
      color: #fff;
    }

    .pdf-header-brand {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .pdf-header-emblem {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      overflow: hidden;
    }

    .pdf-emblem-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .pdf-header-title {
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.06em;
      color: #fff;
    }

    .pdf-header-sub {
      font-size: 9px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 2px;
    }

    .pdf-header-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .pdf-header-id {
      font-size: 11px;
      font-weight: 600;
    }

    .pdf-header-verified {
      background: linear-gradient(135deg, #b8860b 0%, #daa520 100%);
      color: #0a1628;
      padding: 5px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 9px;
      letter-spacing: 0.08em;
    }

    .pdf-doc-title {
      text-align: center;
      padding: 12px;
      background: linear-gradient(180deg, rgba(10,22,40,0.03) 0%, transparent 100%);
      border-bottom: 2px solid #d4af37;
    }

    .pdf-doc-title h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #0a1628;
      letter-spacing: 0.05em;
    }

    .pdf-doc-title p {
      margin: 4px 0 0;
      font-size: 10px;
      color: #64748b;
    }

    .pdf-card-body {
      padding: 20px 24px 16px;
    }

    .pdf-main {
      display: grid;
      grid-template-columns: 120px 1fr 120px;
      gap: 20px;
    }

    .pdf-photo-frame {
      background: #e2e8f0;
      border-radius: 10px;
      padding: 6px;
      border: 1px solid #cbd5e1;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pdf-photo-placeholder {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }

    .pdf-photo-img {
      width: 100%;
      border-radius: 6px;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
    }

    .pdf-pill {
      margin-top: 8px;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      text-align: center;
      font-size: 8px;
      letter-spacing: 0.1em;
    }

    .pdf-pill--active {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: #fff;
    }

    .pdf-pill--warn {
      background: linear-gradient(135deg, #ca8a04 0%, #eab308 100%);
      color: #0f172a;
    }

    .pdf-pill--off {
      background: #94a3b8;
      color: #e2e8f0;
    }

    .pdf-label {
      font-size: 8px;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 2px;
    }

    .pdf-value--xl {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #1f2937;
    }

    .pdf-kv {
      margin-bottom: 8px;
    }

    .pdf-k {
      font-size: 8px;
      letter-spacing: 0.03em;
      color: #64748b;
    }

    .pdf-v {
      font-weight: 700;
      font-size: 11px;
      margin-top: 2px;
      color: #1f2937;
    }

    .pdf-kv--wide .pdf-v {
      word-break: break-all;
      font-size: 10px;
    }

    .pdf-qr-frame {
      padding: 8px;
      border-radius: 10px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
    }

    .pdf-qr-img {
      width: 100%;
      display: block;
      border-radius: 4px;
      background: #fff;
    }

    .pdf-qr-caption {
      margin-top: 6px;
      font-weight: 700;
      font-size: 7px;
      letter-spacing: 0.12em;
      color: #64748b;
    }

    .pdf-hash {
      margin-top: 4px;
      font-size: 8px;
      color: #64748b;
    }

    .pdf-hash-v {
      font-weight: 600;
      color: #1f2937;
      margin-left: 4px;
    }

    .pdf-card-footer {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
    }
  `],
})
export class CredentialViewPdfComponent {
  @Input() data: CredentialPdfData | null = null;
  @Input() photoUrl = '';
  @Input() qrUrl = '';
  @Input() showPhotoPlaceholder = false;
}
