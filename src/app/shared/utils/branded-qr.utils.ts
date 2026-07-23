import QRCode from 'qrcode';

/** Azul naval del aplicativo — módulos del QR. */
const QR_DARK = '#0c2e57';
const QR_LIGHT = '#ffffff';
/** Acento oro institucional alrededor del escudo. */
const QR_LOGO_RING = '#c9a227';

export type BrandedQrOptions = {
  /** Tamaño del canvas en px (cuadrado). */
  size?: number;
  /** URL del escudo/logo (ruta pública o absoluta). */
  logoUrl?: string;
  /** Porción del QR ocupada por el escudo (0–1). Máx. ~0.22 para escaneabilidad. */
  logoRatio?: number;
};

const DEFAULT_LOGO = '/images/ENAP.png';

/**
 * Genera un QR local con el escudo institucional al centro.
 * Usa corrección de error alta (H) para tolerar el logo sobrepuesto.
 */
export async function generateBrandedQrDataUrl(
  data: string,
  options: BrandedQrOptions = {},
): Promise<string> {
  const size = options.size ?? 280;
  const logoUrl = options.logoUrl || DEFAULT_LOGO;
  const logoRatio = Math.min(options.logoRatio ?? 0.2, 0.22);

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, data, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: size,
    color: {
      dark: QR_DARK,
      light: QR_LIGHT,
    },
  });

  try {
    await drawCenteredLogo(canvas, logoUrl, logoRatio);
  } catch (err) {
    console.warn('No se pudo incrustar el escudo en el QR; se usa QR sin logo.', err);
  }

  return canvas.toDataURL('image/png');
}

function drawCenteredLogo(
  canvas: HTMLCanvasElement,
  logoUrl: string,
  logoRatio: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const logo = new Image();
    logo.decoding = 'async';

    logo.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D no disponible'));
          return;
        }

        const size = canvas.width;
        const logoSize = Math.round(size * logoRatio);
        const pad = Math.round(logoSize * 0.18);
        const boxSize = logoSize + pad * 2;
        const boxX = (size - boxSize) / 2;
        const boxY = (size - boxSize) / 2;
        const radius = Math.max(4, Math.round(boxSize * 0.12));

        // Fondo blanco con esquinas redondeadas (protege módulos del QR)
        ctx.fillStyle = QR_LIGHT;
        roundRect(ctx, boxX, boxY, boxSize, boxSize, radius);
        ctx.fill();

        // Anillo dorado sutil
        ctx.strokeStyle = QR_LOGO_RING;
        ctx.lineWidth = Math.max(1.5, size * 0.008);
        roundRect(ctx, boxX + 1, boxY + 1, boxSize - 2, boxSize - 2, radius - 1);
        ctx.stroke();

        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    logo.onerror = () => reject(new Error(`No se pudo cargar el logo: ${logoUrl}`));
    logo.src = logoUrl;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
