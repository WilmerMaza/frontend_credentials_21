import { getHttpErrorMessage } from './http-error.utils';

export type RegistrationErrorAlert = {
  icon: 'error' | 'warning';
  title: string;
  text: string;
  focusField?: 'institutionalEmail';
};

const DUPLICATE_EMAIL_PATTERNS = [
  /duplicate/i,
  /already exists/i,
  /ya existe/i,
  /unique constraint/i,
  /\bP2002\b/,
  /institutionalEmail/i,
  /institutional.?email/i,
  /Person_institutionalEmail_key/i,
  /correo.*registrad/i,
  /email.*registrad/i,
  /correo.*duplicad/i,
];

/** Recorre las formas habituales de error HTTP/Nest/Prisma. */
export function extractFullErrorText(err: unknown): string {
  const parts: string[] = [];
  const e = err as {
    message?: string;
    status?: number;
    error?: string | { message?: string | string[]; error?: string; statusCode?: number };
  };

  if (typeof e?.message === 'string') parts.push(e.message);
  if (typeof e?.error === 'string') parts.push(e.error);

  const body = e?.error;
  if (body && typeof body === 'object') {
    if (Array.isArray(body.message)) parts.push(...body.message);
    else if (typeof body.message === 'string') parts.push(body.message);
    if (typeof body.error === 'string') parts.push(body.error);
    try {
      parts.push(JSON.stringify(body));
    } catch {
      /* ignore */
    }
  }

  return parts.join(' ').trim();
}

export function isGenericRegistrationServerError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const text = extractFullErrorText(err).toLowerCase();
  return status === 500 && text.includes('internal server error');
}

export function isDuplicateEmailError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const message = extractFullErrorText(err);

  if (status === 409) return true;

  if (!message.trim()) return false;

  const looksLikeDuplicate = DUPLICATE_EMAIL_PATTERNS.some((p) => p.test(message));
  if (looksLikeDuplicate && /email|correo|institutional|unique|P2002/i.test(message)) {
    return true;
  }

  if (status === 400 && looksLikeDuplicate) return true;

  return false;
}

export function buildDuplicateEmailAlert(institutionalEmail?: string): RegistrationErrorAlert {
  const email = institutionalEmail?.trim();
  return {
    icon: 'error',
    title: 'Correo ya registrado',
    text: email
      ? `El correo ${email} ya está asociado a otra credencial. Use otro correo institucional o consulte el personal registrado.`
      : 'El correo institucional ya está asociado a otra credencial. Use otro correo o consulte el personal registrado.',
    focusField: 'institutionalEmail',
  };
}

/** Mapea errores HTTP del registro a alertas legibles para el usuario. */
export function getRegistrationErrorAlert(
  err: unknown,
  institutionalEmail?: string,
): RegistrationErrorAlert {
  if (isDuplicateEmailError(err)) {
    return buildDuplicateEmailAlert(institutionalEmail);
  }

  // El backend (Prisma unique) suele responder 500 + "Internal server error" sin detalle.
  if (institutionalEmail?.trim() && isGenericRegistrationServerError(err)) {
    return buildDuplicateEmailAlert(institutionalEmail);
  }

  return {
    icon: 'error',
    title: 'Error al registrar',
    text: getHttpErrorMessage(err, 'registration'),
  };
}
