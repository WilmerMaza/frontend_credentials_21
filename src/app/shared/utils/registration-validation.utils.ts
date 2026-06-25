import { AbstractControl, ValidatorFn } from '@angular/forms';

/** Solo dígitos 0-9. Por defecto permite vacío (teléfono opcional). */
export function digitsOnlyValidator(allowEmpty = true): ValidatorFn {
  return (control: AbstractControl) => {
    const value = String(control.value ?? '').trim();
    if (!value) return allowEmpty ? null : { digitsOnly: true };
    return /^\d+$/.test(value) ? null : { digitsOnly: true };
  };
}

/** Elimina caracteres que no sean dígitos mientras el usuario escribe. */
export function sanitizeDigitsInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'duplicate';

export function patchDuplicateError(
  control: AbstractControl,
  errorKey: string,
  duplicate: boolean,
): void {
  const current = { ...(control.errors ?? {}) };

  if (duplicate) {
    control.setErrors({ ...current, [errorKey]: true });
    return;
  }

  delete current[errorKey];
  control.setErrors(Object.keys(current).length > 0 ? current : null);
}

/** Misma lógica que class-validator @IsEmail() / validator.isEmail (opciones por defecto). */
const EMAIL_USER_UTF8_PART =
  /^[a-z\d!#$%&'*+\-/=?^_`{|}~\u00A1-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;

const EMAIL_TLD =
  /^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i;

const EMAIL_DOMAIN_LABEL = /^[a-z_\u00a1-\uffff0-9-]+$/i;

function emailByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function isEmailDomainFqdn(domain: string): boolean {
  const parts = domain.split('.');
  if (parts.length < 2) return false;

  const tld = parts[parts.length - 1];
  if (!EMAIL_TLD.test(tld) || /\s/.test(tld) || /^\d+$/.test(tld)) {
    return false;
  }

  return parts.every((part) => {
    if (part.length > 63) return false;
    if (!EMAIL_DOMAIN_LABEL.test(part)) return false;
    if (/[\uff01-\uff5e]/.test(part)) return false;
    if (/^-|-$/.test(part)) return false;
    if (/_/.test(part)) return false;
    return true;
  });
}

export function isValidEmailFormat(value: string): boolean {
  const str = value.trim();
  if (!str || str.length > 254) return false;

  const parts = str.split('@');
  if (parts.length < 2) return false;

  const domain = parts.pop() ?? '';
  const user = parts.join('@');
  if (!user || !domain) return false;
  if (emailByteLength(user) > 64 || emailByteLength(domain) > 254) return false;
  if (!isEmailDomainFqdn(domain)) return false;

  return user.split('.').every((part) => EMAIL_USER_UTF8_PART.test(part));
}

/** Sustituto de Validators.email alineado con el backend (@IsEmail). */
export function institutionalEmailValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return isValidEmailFormat(value) ? null : { email: true };
  };
}

export function isIdentityReadyForLookup(value: string): boolean {
  return sanitizeDigitsInput(value).length >= 5;
}

/** Identificadores temporales asignados por el backend a borradores incompletos. */
export function isPlaceholderDraftIdentity(value: unknown): boolean {
  const normalized = String(value ?? '').trim();
  return !normalized || /^DRAFT-/i.test(normalized);
}
