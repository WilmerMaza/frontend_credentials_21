export interface CameraSupportInfo {
  /** API getUserMedia disponible (cámara en vivo en el navegador). */
  canUseGetUserMedia: boolean;
  /** input[type=file] con capture; útil en móviles. */
  canUseNativeCapture: boolean;
  isSecureContext: boolean;
  /** Motivo legible si la cámara en vivo no está disponible. */
  liveCameraBlockReason?: string;
}

export interface CameraErrorAlert {
  icon: 'error' | 'warning' | 'info';
  title: string;
  text: string;
}

/** Evalúa qué estrategias de captura puede usar el navegador actual. */
export function getCameraSupportInfo(): CameraSupportInfo {
  if (typeof window === 'undefined') {
    return {
      canUseGetUserMedia: false,
      canUseNativeCapture: false,
      isSecureContext: false,
      liveCameraBlockReason: 'Entorno sin ventana del navegador.',
    };
  }

  const isSecureContext = window.isSecureContext;
  const hasMediaDevices = typeof navigator.mediaDevices?.getUserMedia === 'function';

  let liveCameraBlockReason: string | undefined;
  if (!isSecureContext) {
    liveCameraBlockReason =
      'La cámara en vivo solo funciona con HTTPS o en localhost. Si accedes por IP (http://192.168.x.x) el navegador la bloquea.';
  } else if (!hasMediaDevices) {
    liveCameraBlockReason = 'Este navegador no soporta acceso a la cámara en la página.';
  }

  return {
    canUseGetUserMedia: isSecureContext && hasMediaDevices,
    canUseNativeCapture: typeof document !== 'undefined',
    isSecureContext,
    liveCameraBlockReason,
  };
}

/** Traduce errores de getUserMedia a mensajes accionables para el usuario. */
export function getCameraErrorAlert(err: unknown, support = getCameraSupportInfo()): CameraErrorAlert {
  const name = err instanceof DOMException ? err.name : '';
  const message = err instanceof Error ? err.message : String(err ?? '');

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return {
        icon: 'warning',
        title: 'Permiso de cámara denegado',
        text:
          'El navegador bloqueó el acceso. Habilita la cámara para este sitio en la configuración del navegador (icono de candado en la barra de direcciones) y vuelve a intentar. También puedes usar "Subir archivo".',
      };
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        icon: 'warning',
        title: 'No se encontró cámara',
        text: 'No hay cámara disponible en este dispositivo. Usa "Subir archivo" para seleccionar una imagen.',
      };
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        icon: 'warning',
        title: 'Cámara en uso',
        text:
          'La cámara está siendo usada por otra aplicación o pestaña. Ciérrala e intenta de nuevo, o usa "Subir archivo".',
      };
    case 'SecurityError':
      return {
        icon: 'warning',
        title: 'Acceso bloqueado por seguridad',
        text:
          support.liveCameraBlockReason ??
          'El navegador impidió el acceso a la cámara por políticas de seguridad. Usa HTTPS o "Subir archivo".',
      };
    case 'OverconstrainedError':
      return {
        icon: 'warning',
        title: 'Cámara no compatible',
        text: 'La cámara del dispositivo no cumple los requisitos solicitados. Usa "Subir archivo".',
      };
    case 'AbortError':
      return {
        icon: 'info',
        title: 'Solicitud cancelada',
        text: 'Se canceló el acceso a la cámara. Puedes intentar de nuevo o subir una foto.',
      };
    default:
      return {
        icon: 'error',
        title: 'Cámara no disponible',
        text:
          message ||
          'No se pudo abrir la cámara. Usa "Subir archivo" o verifica permisos del navegador y del sistema operativo.',
      };
  }
}

/** Mensaje cuando solo está disponible el selector nativo (sin getUserMedia). */
export function getNativeCaptureFallbackAlert(support: CameraSupportInfo): CameraErrorAlert {
  if (!support.isSecureContext) {
    return {
      icon: 'info',
      title: 'Cámara limitada en este entorno',
      text:
        'Sin HTTPS solo se abrirá el selector del dispositivo. En móvil puede abrir la cámara nativa; en escritorio usa "Subir archivo". Para vista previa en vivo, despliega la app con HTTPS.',
    };
  }

  return {
    icon: 'info',
    title: 'Usando cámara del dispositivo',
    text: 'Se abrirá la cámara o galería del sistema. Si no aparece, usa "Subir archivo".',
  };
}
