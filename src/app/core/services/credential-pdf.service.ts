import {
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BYPASS_SPINNER } from '../interceptors/loading.interceptor';
import { EnapApi } from './enap.api';
import {
  CredentialViewPdfComponent,
  type CredentialPdfData,
} from '../../features/credential-view/credential-view-pdf.component';

const IMAGE_LOAD_TIMEOUT_MS = 10000;

const PDF_IMAGE_FALLBACKS = {
  photo: createSvgDataUrl('FOTO NO DISPONIBLE', 320, 410, '#e2e8f0', '#64748b'),
  qr: createSvgDataUrl('QR NO DISPONIBLE', 220, 220, '#ffffff', '#64748b'),
  logo: createSvgDataUrl('LOGO', 120, 120, '#ffffff', '#64748b'),
};

@Injectable({ providedIn: 'root' })
export class CredentialPdfService {
  private readonly http = inject(HttpClient);
  private readonly enap = inject(EnapApi);
  private readonly environmentInjector = inject(EnvironmentInjector);

  async generateBlobFromElement(el: HTMLElement): Promise<Blob> {
    let restoreImages: (() => void) | undefined;

    try {
      restoreImages = await this.inlineImagesForCanvas(el);

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0c2e57',
        onclone: (_doc, cloneEl) => {
          cloneEl.style.opacity = '1';
          let node: HTMLElement | null = cloneEl;
          while (node) {
            node.style.transform = 'none';
            node.style.opacity = '1';
            node = node.parentElement;
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

      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const renderedWidth = canvas.width * scale;
      const renderedHeight = canvas.height * scale;
      const offsetX = (pageWidth - renderedWidth) / 2;
      const offsetY = 0;
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderedWidth, renderedHeight);

      return pdf.output('blob');
    } finally {
      restoreImages?.();
    }
  }

  async generateBlobFromData(
    pdfData: CredentialPdfData,
    environmentInjector?: EnvironmentInjector,
  ): Promise<Blob> {
    const host = document.createElement('div');
    host.className = 'pdf-template-wrapper';
    host.setAttribute('aria-hidden', 'true');
    host.style.position = 'fixed';
    host.style.left = '-9999px';
    host.style.top = '0';
    host.style.pointerEvents = 'none';
    document.body.appendChild(host);

    const compRef = createComponent(CredentialViewPdfComponent, {
      environmentInjector: environmentInjector ?? this.environmentInjector,
      hostElement: host,
    });

    compRef.setInput('data', pdfData);
    compRef.setInput('photoUrl', pdfData.photoUrl ?? '');
    compRef.setInput('qrUrl', pdfData.qrUrl ?? '');
    compRef.setInput('showPhotoPlaceholder', !pdfData.persona.fotoUrl);
    compRef.changeDetectorRef.detectChanges();

    await this.waitForLayout();

    try {
      const el = (host.querySelector('.pdf-card') ?? host.querySelector('.pdf-doc')) as HTMLElement;
      if (!el) {
        throw new Error('No se encontró la plantilla PDF');
      }
      return await this.generateBlobFromElement(el);
    } finally {
      compRef.destroy();
      host.remove();
    }
  }

  buildFileName(pdfData: CredentialPdfData): string {
    const slug =
      pdfData.persona.nombreCompleto?.replace(/\s+/g, '-') || pdfData.persona.identificacion;
    return `credencial-${pdfData.tipoRegistro.codigo}-${slug}.pdf`;
  }

  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private waitForLayout(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  private async inlineImagesForCanvas(root: HTMLElement): Promise<() => void> {
    const images = Array.from(root.querySelectorAll('img'));
    const originalState = images.map((image) => ({
      image,
      src: image.getAttribute('src'),
      crossOrigin: image.getAttribute('crossorigin'),
    }));

    await Promise.all(
      images.map(async (image) => {
        const src = image.currentSrc || image.getAttribute('src');
        if (!src || src.startsWith('data:')) {
          await this.waitForImage(image).catch(() => undefined);
          return;
        }

        const fallback = this.getPdfImageFallback(image);

        try {
          const absoluteUrl = new URL(src, window.location.href).toString();
          const dataUrl = await this.fetchImageAsDataUrl(absoluteUrl);
          image.removeAttribute('crossorigin');
          image.src = dataUrl;
          await this.waitForImage(image);
        } catch (err) {
          const status = (err as { status?: number })?.status;
          if (status !== 0) {
            console.warn('No se pudo incrustar una imagen en el PDF:', src, err);
          }
          image.removeAttribute('crossorigin');
          image.src = fallback;
          await this.waitForImage(image).catch(() => undefined);
        }
      }),
    );

    return () => {
      originalState.forEach(({ image, src, crossOrigin }) => {
        if (crossOrigin == null) {
          image.removeAttribute('crossorigin');
        } else {
          image.setAttribute('crossorigin', crossOrigin);
        }

        if (src == null) {
          image.removeAttribute('src');
        } else {
          image.setAttribute('src', src);
        }
      });
    };
  }

  private async fetchImageAsDataUrl(url: string): Promise<string> {
    const apiPath = this.toApiPath(url);
    const context = new HttpContext().set(BYPASS_SPINNER, true);

    if (apiPath) {
      const blob = await firstValueFrom(
        this.enap.request<Blob>('GET', apiPath, {
          responseType: 'blob',
          context,
        }),
      );
      return this.blobToDataUrl(blob);
    }

    const blob = await firstValueFrom(
      this.http.get(url, {
        responseType: 'blob',
        withCredentials: false,
        context,
      }),
    );

    return this.blobToDataUrl(blob);
  }

  /** Rutas del API (p. ej. /uploads/credentials/...) usan sesión JWT vía cookies. */
  private toApiPath(url: string): string | null {
    const base = environment.enap_api.replace(/\/$/, '');
    try {
      const parsed = new URL(url, window.location.href);
      const baseParsed = new URL(base, window.location.href);
      if (parsed.origin !== baseParsed.origin) {
        return null;
      }
      const path = `${parsed.pathname}${parsed.search}`;
      return path.startsWith('/') ? path : `/${path}`;
    } catch {
      return null;
    }
  }

  private getPdfImageFallback(image: HTMLImageElement): string {
    if (image.classList.contains('pdf-photo-img')) return PDF_IMAGE_FALLBACKS.photo;
    if (image.classList.contains('pdf-qr-img')) return PDF_IMAGE_FALLBACKS.qr;
    if (image.classList.contains('brand__logo')) return PDF_IMAGE_FALLBACKS.logo;
    return PDF_IMAGE_FALLBACKS.logo;
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(blob);
    });
  }

  private waitForImage(image: HTMLImageElement): Promise<void> {
    if (image.complete) {
      return image.naturalWidth > 0
        ? Promise.resolve()
        : Promise.reject(new Error(`Imagen sin contenido cargado: ${image.src}`));
    }

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Tiempo agotado cargando imagen: ${image.src}`));
      }, IMAGE_LOAD_TIMEOUT_MS);

      const cleanup = () => {
        window.clearTimeout(timeout);
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
      };
      const onLoad = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`No se pudo cargar imagen: ${image.src}`));
      };

      image.addEventListener('load', onLoad, { once: true });
      image.addEventListener('error', onError, { once: true });
    });
  }
}

function createSvgDataUrl(
  label: string,
  width: number,
  height: number,
  background: string,
  foreground: string,
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${background}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${Math.max(14, Math.floor(width / 12))}"
        font-weight="700" fill="${foreground}">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
