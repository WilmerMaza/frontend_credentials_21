import { sanitizeDigitsInput } from './registration-validation.utils';
import { cursorAfterDigits } from './identity-input.utils';

export const DEFAULT_PHONE_PREFIX = '+57';
export const MAX_DIAL_CODE_LENGTH = 3;

export interface ParsedPhoneInput {
  prefix: string;
  digits: string;
  explicit?: boolean;
  awaitingLocal?: boolean;
}

export interface ResolvePhonePrefixOptions {
  explicit?: boolean;
}

export interface ParsePhoneInputOptions {
  splitWithoutSpace?: boolean;
}

/** Códigos ITU (más largos primero en runtime). */
const DIAL_CODES = [
  '593', '591', '598', '595', '594', '592', '590', '509', '508', '507', '506', '505', '504', '503', '502', '501',
  '58', '57', '56', '55', '54', '53', '52', '51', '49', '48', '47', '46', '45', '44', '43', '41', '39', '34',
  '33', '32', '31', '30', '27', '20', '7', '81', '82', '86', '91', '61', '64', '1',
];

const DIAL_CODES_DESC = [...DIAL_CODES].sort((a, b) => b.length - a.length);
const DIAL_CODE_SET = new Set(DIAL_CODES);

interface DialMatchOptions {
  /** Mínimo de dígitos locales cuando hay número (p. ej. pegado sin +). */
  minLocal?: number;
  /** Acepta prefijo sin dígitos locales aún. */
  allowEmptyLocal?: boolean;
}

function normalizePrefix(prefix: string): string {
  const trimmed = String(prefix ?? '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${sanitizeDigitsInput(trimmed)}`;
}

export function isColombianLocalNumber(digits: string): boolean {
  return /^3\d{9}$/.test(sanitizeDigitsInput(digits));
}

function isPrefixOfLongerDialCode(digits: string): boolean {
  return DIAL_CODES.some((code) => code.startsWith(digits) && code.length > digits.length);
}

function isCompleteExplicitPrefix(prefixDigits: string): boolean {
  if (!prefixDigits) return false;
  if (DIAL_CODE_SET.has(prefixDigits)) return prefixDigits.length >= 2;
  if (prefixDigits.length < MAX_DIAL_CODE_LENGTH) return !isPrefixOfLongerDialCode(prefixDigits);
  return prefixDigits.length === MAX_DIAL_CODE_LENGTH;
}

/** Busca el código de marcación más largo al inicio de `digits`. */
function matchKnownDialCode(digits: string, options: DialMatchOptions = {}): { code: string; local: string } | null {
  const { minLocal = 0, allowEmptyLocal = false } = options;

  for (const code of DIAL_CODES_DESC) {
    if (!digits.startsWith(code)) continue;

    const local = digits.slice(code.length);
    if (!allowEmptyLocal && !local) continue;
    if (code.length === 1 && local.length > 0 && local.length < 2) continue;
    if (minLocal > 0 && local.length > 0 && local.length < minLocal) continue;
    if (code === '30' && isColombianLocalNumber(digits)) continue;

    return { code, local };
  }

  return null;
}

function repairColombianMisparsedPrefix(prefix: string, localDigits: string): ParsedPhoneInput | null {
  const prefixDigits = sanitizeDigitsInput(prefix);
  const local = sanitizeDigitsInput(localDigits);
  if (!prefixDigits.startsWith('57') || prefixDigits.length <= 2 || !local) return null;

  const merged = prefixDigits.slice(2) + local;
  if (!isColombianLocalNumber(merged)) return null;

  return { prefix: '+57', digits: merged, explicit: true };
}

function finalizeExplicitParse(prefix: string, localDigits: string): ParsedPhoneInput & { explicit: true } {
  const repaired = repairColombianMisparsedPrefix(prefix, localDigits);
  if (repaired) return { ...repaired, explicit: true };

  return {
    prefix: normalizePrefix(prefix),
    digits: sanitizeDigitsInput(localDigits),
    explicit: true,
  };
}

function trySplitThreeDigitExplicitPrefix(
  prefixDigits: string,
): (ParsedPhoneInput & { explicit: true }) | null {
  if (prefixDigits.length !== MAX_DIAL_CODE_LENGTH) return null;

  const twoDigit = prefixDigits.slice(0, 2);
  const third = prefixDigits[2];

  if (
    !DIAL_CODE_SET.has(prefixDigits) &&
    !DIAL_CODE_SET.has(twoDigit) &&
    !isPrefixOfLongerDialCode(twoDigit) &&
    isCompleteExplicitPrefix(twoDigit) &&
    third === '3'
  ) {
    return { prefix: `+${twoDigit}`, digits: third, explicit: true };
  }

  if (isCompleteExplicitPrefix(prefixDigits)) {
    return { prefix: `+${prefixDigits}`, digits: '', explicit: true, awaitingLocal: true };
  }

  return null;
}

function trySplitUnknownPrefix(prefixDigits: string): (ParsedPhoneInput & { explicit: true }) | null {
  if (prefixDigits.length <= MAX_DIAL_CODE_LENGTH) return null;

  for (const len of [MAX_DIAL_CODE_LENGTH, 2]) {
    const candidate = prefixDigits.slice(0, len);
    const local = prefixDigits.slice(len);
    if (!local) continue;
    if (len === MAX_DIAL_CODE_LENGTH && DIAL_CODE_SET.has(candidate.slice(0, 2))) continue;
    if (!DIAL_CODE_SET.has(candidate) && !isPrefixOfLongerDialCode(candidate)) {
      return finalizeExplicitParse(`+${candidate}`, local);
    }
  }

  return null;
}

/** Separa prefijo explícito (+…) y número local a partir solo de dígitos tras el +. */
function parsePlusDigitString(
  prefixDigits: string,
  options?: ParsePhoneInputOptions,
): ParsedPhoneInput & { explicit: true } {
  const withLocal = matchKnownDialCode(prefixDigits, { allowEmptyLocal: false });
  if (withLocal?.local) {
    return finalizeExplicitParse(`+${withLocal.code}`, withLocal.local);
  }

  if (!options?.splitWithoutSpace) {
    const threeDigit = trySplitThreeDigitExplicitPrefix(prefixDigits);
    if (threeDigit) return threeDigit;
  }

  if (prefixDigits.length > MAX_DIAL_CODE_LENGTH) {
    const unknownSplit = trySplitUnknownPrefix(prefixDigits);
    if (unknownSplit) return unknownSplit;
  }

  if (isCompleteExplicitPrefix(prefixDigits)) {
    return { prefix: `+${prefixDigits}`, digits: '', explicit: true, awaitingLocal: true };
  }

  return { prefix: `+${prefixDigits}`, digits: '', explicit: true };
}

export function normalizePhoneDigits(allDigits: string): ParsedPhoneInput {
  const digits = sanitizeDigitsInput(allDigits);
  if (!digits) return { prefix: '', digits: '' };
  if (isColombianLocalNumber(digits)) return { prefix: '', digits };

  if (digits.startsWith('57')) {
    const local = digits.slice(2);
    if (isColombianLocalNumber(local)) return { prefix: '+57', digits: local };
  }

  const international = matchKnownDialCode(digits, { minLocal: 5 });
  if (international) return { prefix: `+${international.code}`, digits: international.local };

  return { prefix: '', digits };
}

export function parseExplicitPlusInput(
  raw: string,
  options?: ParsePhoneInputOptions,
): ParsedPhoneInput & { explicit: true } {
  const leadingTrimmed = String(raw ?? '').trimStart();
  if (!leadingTrimmed.startsWith('+')) {
    return { prefix: '+', digits: '', explicit: true };
  }

  const afterPlus = leadingTrimmed.slice(1);
  const spaceIndex = afterPlus.search(/\s/);

  if (spaceIndex >= 0) {
    const dialDigits = afterPlus.slice(0, spaceIndex).match(/^(\d{1,3})/)?.[1] ?? '';
    const localDigits = sanitizeDigitsInput(afterPlus.slice(spaceIndex + 1));
    const parsed = finalizeExplicitParse(dialDigits ? `+${dialDigits}` : '+', localDigits);
    return { ...parsed, awaitingLocal: !localDigits };
  }

  const prefixDigits = sanitizeDigitsInput(afterPlus);
  if (!prefixDigits) return { prefix: '+', digits: '', explicit: true };

  return parsePlusDigitString(prefixDigits, options);
}

export function resolvePhonePrefix(
  prefix: string,
  localDigits: string,
  options?: ResolvePhonePrefixOptions,
): string {
  const normalized = normalizePrefix(prefix);
  if (options?.explicit) return normalized;
  if (normalized) return normalized;
  if (sanitizeDigitsInput(localDigits)) return DEFAULT_PHONE_PREFIX;
  return '';
}

export function parsePhoneInput(raw: string, options?: ParsePhoneInputOptions): ParsedPhoneInput {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return { prefix: '', digits: '' };

  const brokenFormatted = trimmed.match(/^\(\+\)\s*(\d*)$/);
  if (brokenFormatted) {
    return {
      prefix: brokenFormatted[1] ? `+${brokenFormatted[1]}` : '+',
      digits: '',
      explicit: true,
    };
  }

  const formatted = trimmed.match(/^\(\+(\d{1,3})\)\s*(.*)$/);
  if (formatted) {
    const localDigits = sanitizeDigitsInput(formatted[2]);
    if (!formatted[1] && !localDigits) return { prefix: '+', digits: '', explicit: true };

    const repaired = repairColombianMisparsedPrefix(`+${formatted[1]}`, localDigits);
    if (repaired) return repaired;

    return { prefix: `+${formatted[1]}`, digits: localDigits, explicit: true };
  }

  if (trimmed.startsWith('+')) return parseExplicitPlusInput(raw, options);

  const allDigits = sanitizeDigitsInput(trimmed);
  return allDigits ? normalizePhoneDigits(allDigits) : { prefix: '', digits: '' };
}

export function deserializePhoneValue(value: string): ParsedPhoneInput {
  const digits = sanitizeDigitsInput(String(value ?? '').trim());
  return digits ? normalizePhoneDigits(digits) : { prefix: '', digits: '' };
}

export function serializePhoneValue(
  prefix: string,
  localDigits: string,
  options?: ResolvePhonePrefixOptions,
): string {
  const local = sanitizeDigitsInput(localDigits);
  if (!local) return '';

  const code = sanitizeDigitsInput(resolvePhonePrefix(prefix, localDigits, options));
  return code ? `${code}${local}` : local;
}

export function formatPhoneDisplay(
  localDigits: string,
  prefix: string,
  options?: ResolvePhonePrefixOptions & { awaitingLocal?: boolean },
): string {
  const clean = sanitizeDigitsInput(localDigits);
  const normalized = normalizePrefix(prefix);
  const effectivePrefix = normalized || (!options?.explicit && clean ? DEFAULT_PHONE_PREFIX : '');

  if (!clean) {
    if (options?.explicit) return options.awaitingLocal ? `${normalized || '+'} ` : normalized || '+';
    return effectivePrefix ? `(${effectivePrefix}) ` : '';
  }

  return effectivePrefix ? `(${effectivePrefix}) ${clean}` : clean;
}

export function applyPhoneInputFormatting(
  input: HTMLInputElement,
  localDigits: string,
  prefix: string,
  options?: ResolvePhonePrefixOptions & { awaitingLocal?: boolean },
): void {
  const formatted = formatPhoneDisplay(localDigits, prefix, options);
  if (input.value === formatted) return;

  const selectionStart = input.selectionStart ?? input.value.length;
  const localDigitsBefore = countLocalDigitsBefore(input.value, selectionStart);

  input.value = formatted;
  const newCursor = cursorAfterLocalDigits(formatted, localDigitsBefore);
  input.setSelectionRange(newCursor, newCursor);
}

function countLocalDigitsBefore(value: string, selectionStart: number): number {
  const before = value.slice(0, selectionStart);
  const formatted = before.match(/^\(\+\d+\)\s*(.*)$/);
  if (formatted) return sanitizeDigitsInput(formatted[1]).length;

  const spacedExplicit = before.match(/^\+\d+\s+(.*)$/);
  if (spacedExplicit) return sanitizeDigitsInput(spacedExplicit[1]).length;

  return /^\+\d*$/.test(before) ? 0 : sanitizeDigitsInput(before).length;
}

function cursorAfterLocalDigits(formatted: string, localDigitCount: number): number {
  const parenMatch = formatted.match(/^(\(\+\d+\)\s*)(.*)$/);
  if (parenMatch) {
    const [prefixPart, localPart] = [parenMatch[1], parenMatch[2]];
    return localDigitCount <= 0 ? prefixPart.length : prefixPart.length + cursorAfterDigits(localPart, localDigitCount);
  }

  const spacedMatch = formatted.match(/^(\+\d+\s+)(.*)$/);
  if (spacedMatch) {
    const [prefixPart, localPart] = [spacedMatch[1], spacedMatch[2]];
    return localDigitCount <= 0 ? prefixPart.length : prefixPart.length + cursorAfterDigits(localPart, localDigitCount);
  }

  return cursorAfterDigits(formatted, localDigitCount);
}

export function sanitizePhonePartialInput(raw: string): string {
  return String(raw ?? '').replace(/[^\d+() ]/g, '');
}
