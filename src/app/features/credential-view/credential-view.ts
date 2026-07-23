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
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import {
  CredentialViewPdfComponent,
  type CredentialPdfData,
} from './credential-view-pdf.component';
import { PersonalListService } from '../personal-registrado/data/personal-list.service';
import type { PersonalItem } from '../personal-registrado/models/personal-item.model';
import type { CredentialData } from './credential-data.types';
import { onCredentialPhotoError, resolveCredentialPhotoUrl } from '../../shared/utils/url.utils';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import {
  deriveValidoHasta,
  mapPersonalItemToCredentialData,
} from './credential-mapper';
import { CredentialPdfService } from '../../core/services/credential-pdf.service';
import { MailService } from '../../core/services/mail.service';
import { getHttpErrorMessage } from '../../shared/utils/http-error.utils';
import {
  getCredentialStatusBadgeClass,
  getCredentialStatusLabel,
} from '../../shared/utils/credential-status.utils';
import { generateBrandedQrDataUrl } from '../../shared/utils/branded-qr.utils';

const DEFAULT_LOGO = '/images/ENAP.png';
const QR_CANVAS_SIZE = 280;

@Component({
  selector: 'app-credential-view',
  standalone: true,
  templateUrl: './credential-view.html',
  styleUrls: ['./credential-view.scss'],
  imports: [CommonModule, MatIconModule, CredentialViewPdfComponent, BreadcrumbComponent],
})
export class CredentialView implements OnInit, OnDestroy {
  @ViewChild('credentialCardDesktop') credentialCardDesktop?: ElementRef<HTMLElement>;
  @ViewChild('credentialCardMobile') credentialCardMobile?: ElementRef<HTMLElement>;
  @ViewChild('pdfTemplate') pdfTemplate?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly personalListService = inject(PersonalListService);
  private readonly credentialPdfService = inject(CredentialPdfService);
  private readonly mailService = inject(MailService);
  private breakpointSub?: { unsubscribe: () => void };
  private detailLoadSub?: { unsubscribe: () => void };
  private qrGenerationToken = 0;

  credential = signal<CredentialData | null>(null);
  private readonly credentialId = signal<string | null>(null);
  isMobile = signal(false);
  readonly pdfDownloading = signal(false);
  readonly sharing = signal(false);
  /** Data URL del QR generado en cliente (con escudo). */
  readonly qrUrl = signal('');
  readonly qrLoading = signal(false);
  readonly qrError = signal(false);

  readonly breadcrumbItems = [
    { label: 'Personal Registrado', url: '/personal-registrado' },
    { label: 'Visualización de Credencial' },
  ];

  readonly getCredentialStatusLabel = getCredentialStatusLabel;
  readonly getCredentialStatusBadgeClass = getCredentialStatusBadgeClass;

  readonly logoUrl = computed(() => {
    const c = this.credential();
    return c?.org?.logoUrl || DEFAULT_LOGO;
  });

  readonly photoUrl = computed(() => {
    const c = this.credential();
    return resolveCredentialPhotoUrl(c?.persona?.fotoUrl);
  });

  readonly onPhotoError = onCredentialPhotoError;

  readonly pdfData = computed((): CredentialPdfData | null => {
    const c = this.credential();
    if (!c) return null;
    return {
      org: c.org,
      doc: c.doc,
      persona: c.persona,
      tipoRegistro: c.tipoRegistro,
      resumen: c.resumen,
      estado: c.estado,
      camposPrincipales: c.camposPrincipales,
      camposSecundarios: c.camposSecundarios,
      contacto: c.contacto,
      verificacion: c.verificacion,
      vigencia: c.vigencia,
      photoUrl: this.photoUrl(),
      qrUrl: this.qrUrl(),
    };
  });

  ngOnInit(): void {
    const state = history.state as
      | { credential?: PersonalItem & { fechaNacimiento?: string } }
      | undefined;
    const cred = state?.credential;
    const routeId = this.route.snapshot.paramMap.get('id');

    this.breakpointSub = this.breakpointObserver
      .observe('(max-width: 992px)')
      .subscribe((s) => this.isMobile.set(s.matches));

    if (cred) {
      this.setCredential(cred);
    }

    const credentialId = routeId ?? cred?.id;
    if (!credentialId) {
      this.router.navigate(['/personal-registrado']);
      return;
    }

    this.credentialId.set(credentialId);

    this.detailLoadSub = this.personalListService.getById(credentialId).subscribe({
      next: (credential) => this.setCredential(credential),
      error: (err) => {
        console.error('Error cargando detalle de credencial:', err);
        if (!cred) {
          this.router.navigate(['/personal-registrado']);
        }
      },
    });
  }

  private setCredential(cred: PersonalItem & { fechaNacimiento?: string }): void {
    const ext = cred as PersonalItem & {
      fechaNacimiento?: string;
      emision?: string;
      validoHasta?: string;
      sha256?: string;
    };
    if (cred.id) {
      this.credentialId.set(cred.id);
    }
    const extended: CredentialData = mapPersonalItemToCredentialData({
      ...cred,
      fechaNacimiento: ext.fechaNacimiento,
      emision: ext.emision ?? cred.fechaIngreso ?? '20/11/2025',
      validoHasta: cred.validoHasta || deriveValidoHasta(cred.fechaIngreso),
      sha256: ext.sha256 ?? 'A3F7C92E...4D8B92E1',
    });
    this.credential.set(extended);
    void this.refreshBrandedQr(extended);
  }

  private async refreshBrandedQr(credential: CredentialData): Promise<void> {
    const token = ++this.qrGenerationToken;
    const payload = credential.verificacion.qrData;
    const previous = this.qrUrl();

    // Si ya hay QR, mantenlo visible mientras regeneramos (evita parpadeo al refrescar).
    this.qrLoading.set(!previous);
    this.qrError.set(false);

    try {
      const url = await generateBrandedQrDataUrl(payload, {
        size: QR_CANVAS_SIZE,
        logoUrl: credential.org.logoUrl || DEFAULT_LOGO,
      });
      if (token !== this.qrGenerationToken) return;
      this.qrUrl.set(url);
      this.qrError.set(false);
    } catch (err) {
      console.error('Error generando QR de credencial:', err);
      if (token !== this.qrGenerationToken) return;
      if (!previous) {
        this.qrUrl.set('');
        this.qrError.set(true);
      }
    } finally {
      if (token === this.qrGenerationToken) {
        this.qrLoading.set(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.qrGenerationToken++;
    this.breakpointSub?.unsubscribe();
    this.detailLoadSub?.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/personal-registrado']);
  }

  private getPdfElement(): HTMLElement | null {
    const wrapper = this.pdfTemplate?.nativeElement;
    return (wrapper?.querySelector('.pdf-card') ?? wrapper?.querySelector('.pdf-doc')) as HTMLElement | null;
  }

  async onDownloadPdf(): Promise<void> {
    if (this.pdfDownloading()) return;

    const id =
      this.credentialId() ??
      this.route.snapshot.paramMap.get('id') ??
      null;
    if (!id) {
      void Swal.fire({
        icon: 'error',
        title: 'Error al descargar PDF',
        text: 'No se pudo identificar la credencial.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    this.pdfDownloading.set(true);
    try {
      const data = this.pdfData();
      const fileName = data
        ? this.credentialPdfService.buildFileName(data)
        : `credencial-${id}.pdf`;
      await this.credentialPdfService.downloadFromApi(id, fileName);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      void Swal.fire({
        icon: 'error',
        title: 'Error al descargar PDF',
        text: getHttpErrorMessage(err),
        confirmButtonColor: '#163665',
      });
    } finally {
      this.pdfDownloading.set(false);
    }
  }

  async onShare(): Promise<void> {
    if (this.sharing() || this.pdfDownloading()) return;

    const c = this.credential();
    const email = c?.contacto?.correo?.trim();
    if (!email) {
      void Swal.fire({
        icon: 'error',
        title: 'Correo no disponible',
        text: 'Esta credencial no tiene un correo institucional registrado.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    const el = this.getPdfElement();
    if (!el) {
      void Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo preparar la credencial para enviar.',
        confirmButtonColor: '#163665',
      });
      return;
    }

    this.sharing.set(true);
    void Swal.fire({
      title: 'Enviando credencial...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const blob = await this.credentialPdfService.generateBlobFromElement(el);
      const nombre = c!.persona.nombreCompleto;
      await firstValueFrom(
        this.mailService.sendCredentialEmail(email, blob, {
          subject: nombre ? `Tu credencial - ${nombre}` : 'Tu credencial',
        }),
      );
      Swal.close();
      void Swal.fire({
        icon: 'success',
        title: 'Credencial enviada',
        text: `Se envió la credencial a ${email}.`,
        confirmButtonColor: '#163665',
      });
    } catch (err) {
      console.error('Error al compartir credencial:', err);
      Swal.close();
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar',
        text: getHttpErrorMessage(err, 'mail'),
        confirmButtonColor: '#163665',
      });
    } finally {
      this.sharing.set(false);
    }
  }
}
