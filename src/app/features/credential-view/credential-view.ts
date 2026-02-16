import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  CredentialViewPdfComponent,
  type CredentialPdfData,
} from './credential-view-pdf.component';
import type { PersonalItem } from '../personal-registrado/personal-registrado';
import type { CredentialData } from './credential-data.types';

const DEFAULT_LOGO = '/images/ENAP.png';
const DEFAULT_PHOTO = 'https://i.imgur.com/8Km9tLL.png';

function mapPersonalItemToCredentialData(
  item: PersonalItem & {
    unidad?: string;
    fechaNacimiento?: string;
    emision?: string;
    validoHasta?: string;
    sha256?: string;
  },
): CredentialData {
  const emision = item.emision ?? item.fechaIngreso ?? '20/11/2025';
  const validoHasta = item.validoHasta ?? deriveValidoHasta(item.fechaIngreso);
  const anios = item.fechaIngreso ? calcAniosServicio(item.fechaIngreso) : 0;
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';

  return {
    org: {
      nombre: 'FUERZAS ARMADAS',
      pais: 'República de Colombia',
      dependencia: 'Comando General – Departamento de Recursos Humanos',
      logoUrl: DEFAULT_LOGO,
    },
    doc: {
      numeroOficial: item.identificacion,
      titulo: 'CREDENCIAL DE IDENTIFICACIÓN',
      subtitulo: 'Documento Oficial Certificado',
    },
    persona: {
      nombreCompleto: item.nombreCompleto,
      identificacion: item.identificacion,
      fechaNacimiento: item.fechaNacimiento ?? '1990-03-15',
      tipoSangre: 'O+',
      fotoUrl: item.photoUrl,
    },
    militar: {
      rango: item.rango,
      unidad: item.unidad ?? 'Batallón de Infantería 7',
      fechaIngreso: item.fechaIngreso,
      aniosServicio: anios,
      especialidad: 'Infantería',
      estado: (item.estado ?? 'activo').toUpperCase(),
    },
    contacto: {
      correo: item.correo,
    },
    verificacion: {
      qrData: `${baseUrl}/verify/${encodeURIComponent(item.identificacion)}`,
      sha256: item.sha256 ?? 'A3F7C92E...4D8B92E1',
      verificado: true,
    },
    vigencia: {
      emision,
      validoHasta,
    },
  };
}

function calcAniosServicio(fechaIngreso: string): number {
  try {
    const parts = fechaIngreso.split(/[/-]/).map(Number);
    if (parts.length < 3) return 0;
    let d: number, m: number, y: number;
    if (parts[0]! > 31) {
      [y, m, d] = [parts[0]!, parts[1]! || 1, parts[2]! || 1];
    } else {
      [d, m, y] = [parts[0]! || 1, parts[1]! || 1, parts[2]!];
    }
    const ingreso = new Date(y, m - 1, d);
    const hoy = new Date();
    return Math.max(
      0,
      Math.floor((hoy.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    );
  } catch {
    return 0;
  }
}

function deriveValidoHasta(fechaIngreso?: string): string {
  if (!fechaIngreso) return '20/11/2030';
  try {
    const parts = fechaIngreso.split(/[/-]/).map(Number);
    if (parts.length < 3) return '20/11/2030';
    let d: number, m: number, y: number;
    if (parts[0]! > 31) {
      [y, m, d] = [parts[0]!, parts[1]! || 1, parts[2]! || 1];
    } else {
      [d, m, y] = [parts[0]! || 1, parts[1]! || 1, parts[2]!];
    }
    const date = new Date(y, m - 1, d);
    date.setFullYear(date.getFullYear() + 5);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '20/11/2030';
  }
}

@Component({
  selector: 'app-credential-view',
  standalone: true,
  templateUrl: './credential-view.html',
  styleUrls: ['./credential-view.scss'],
  imports: [CommonModule, MatIconModule, CredentialViewPdfComponent],
})
export class CredentialView implements OnInit, OnDestroy {
  @ViewChild('credentialCardDesktop') credentialCardDesktop?: ElementRef<HTMLElement>;
  @ViewChild('credentialCardMobile') credentialCardMobile?: ElementRef<HTMLElement>;
  @ViewChild('pdfTemplate') pdfTemplate?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private breakpointSub?: { unsubscribe: () => void };

  credential = signal<CredentialData | null>(null);
  isMobile = signal(false);

  readonly logoUrl = computed(() => {
    const c = this.credential();
    return c?.org?.logoUrl || DEFAULT_LOGO;
  });

  readonly qrUrl = computed(() => {
    const c = this.credential();
    if (!c) return '';
    const data = encodeURIComponent(c.verificacion.qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${data}`;
  });

  readonly qrUrlMobile = computed(() => {
    const c = this.credential();
    if (!c) return '';
    const data = encodeURIComponent(c.verificacion.qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${data}`;
  });

  readonly photoUrl = computed(() => {
    const c = this.credential();
    return c?.persona?.fotoUrl || DEFAULT_PHOTO;
  });

  readonly pdfData = computed((): CredentialPdfData | null => {
    const c = this.credential();
    if (!c) return null;
    return {
      org: c.org,
      doc: c.doc,
      persona: c.persona,
      militar: c.militar,
      contacto: c.contacto,
      verificacion: c.verificacion,
      vigencia: c.vigencia,
      photoUrl: this.photoUrl(),
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(c.verificacion.qrData)}`,
    };
  });

  ngOnInit(): void {
    const state = history.state as
      | { credential?: PersonalItem & { unidad?: string; fechaNacimiento?: string } }
      | undefined;
    const cred = state?.credential;

    if (!cred) {
      this.router.navigate(['/personal-registrado']);
      return;
    }

    const ext = cred as PersonalItem & {
      unidad?: string;
      fechaNacimiento?: string;
      emision?: string;
      validoHasta?: string;
      sha256?: string;
    };
    const extended: CredentialData = mapPersonalItemToCredentialData({
      ...cred,
      unidad: ext.unidad ?? 'Batallón de Infantería 7',
      fechaNacimiento: ext.fechaNacimiento ?? '15/03/1990',
      emision: ext.emision ?? cred.fechaIngreso ?? '20/11/2025',
      validoHasta: ext.validoHasta ?? deriveValidoHasta(cred.fechaIngreso),
      sha256: ext.sha256 ?? 'A3F7C92E...4D8B92E1',
    });
    this.credential.set(extended);

    this.breakpointSub = this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((s) => this.isMobile.set(s.matches));
  }

  ngOnDestroy(): void {
    this.breakpointSub?.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/personal-registrado']);
  }

  async onDownloadPdf(): Promise<void> {
    const wrapper = this.pdfTemplate?.nativeElement;
    const el = wrapper?.querySelector('.pdf-doc') as HTMLElement;
    if (!el) return;

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (_doc, cloneEl) => {
          cloneEl.style.opacity = '1';
          const wrapper = cloneEl.parentElement;
          if (wrapper) {
            wrapper.style.left = '0';
            wrapper.style.opacity = '1';
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      const c = this.credential();
      const fileName = c
        ? `credencial-${c.persona.nombreCompleto?.replace(/\s+/g, '-') || c.persona.identificacion}.pdf`
        : 'credencial-militar.pdf';
      pdf.save(fileName);
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  }

  onShare(): void {
    // Placeholder: implementar compartir
  }

  onSendToMobile(): void {
    // Placeholder: implementar enviar al móvil
  }
}
