import { sanitizeDigitsInput } from './registration-validation.utils';

export type IdentityIdType = 'cc' | 'ti' | 'ce' | 'pasaporte' | '';

export interface ParsedIdentityInput {
  /** Prefijo detectado al escribir (p. ej. CC); no se muestra en el campo. */
  prefix: string;
  /** Solo dígitos del número de identificación. */
  digits: string;
}

const PREFIX_TO_ID_TYPE: Record<string, IdentityIdType> = {
  cc: 'cc',
  ti: 'ti',
  ce: 'ce',
  pasaporte: 'pasaporte',
  pas: 'pasaporte',
};

/** Separa prefijo y dígitos cuando el usuario pega o escribe "CC1234567", "CC-123", etc. */
export function parseIdentityInput(raw: string): ParsedIdentityInput {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { prefix: '', digits: '' };

  const withAlpha = trimmed.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]{1,12})[-\s.]?([\d\s.].*)$/);
  if (withAlpha) {
    const digitPart = sanitizeDigitsInput(withAlpha[2]);
    if (digitPart) {
      return {
        prefix: withAlpha[1].toUpperCase(),
        digits: digitPart,
      };
    }
  }

  return { prefix: '', digits: sanitizeDigitsInput(trimmed) };
}

export function resolveIdTypeFromPrefix(prefix: string): IdentityIdType {
  const normalized = prefix.trim().toLowerCase().replace(/[.\s-]/g, '');
  return PREFIX_TO_ID_TYPE[normalized] ?? '';
}

export function formatThousandsDots(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Solo número indentado con puntos de miles (sin prefijo CC/TI en pantalla). */
export function formatIdentityDisplay(digits: string): string {
  const clean = sanitizeDigitsInput(digits);
  if (!clean) return '';
  return formatThousandsDots(clean);
}

export function applyIdentityInputFormatting(input: HTMLInputElement, digits: string): void {
  const formatted = formatIdentityDisplay(digits);
  if (input.value === formatted) return;

  const selectionStart = input.selectionStart ?? input.value.length;
  const digitsBeforeCursor = sanitizeDigitsInput(input.value.slice(0, selectionStart)).length;

  input.value = formatted;

  const newCursor = cursorAfterDigits(formatted, digitsBeforeCursor);
  input.setSelectionRange(newCursor, newCursor);
}

export function cursorAfterDigits(formatted: string, digitsCount: number): number {
  if (digitsCount <= 0) return formatted.search(/\d/) >= 0 ? formatted.search(/\d/) : 0;

  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen >= digitsCount) return i + 1;
    }
  }

  return formatted.length;
}
