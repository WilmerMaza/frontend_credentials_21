import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PHONE_PREFIX,
  deserializePhoneValue,
  formatPhoneDisplay,
  parsePhoneInput,
  type ParsePhoneInputOptions,
  type ParsedPhoneInput,
  resolvePhonePrefix,
  serializePhoneValue,
} from './phone-input.utils';

type ParseCase = {
  input: string;
  options?: ParsePhoneInputOptions;
  expected: ParsedPhoneInput;
};

const explicit = (
  expected: Omit<ParsedPhoneInput, 'explicit'>,
): ParsedPhoneInput & { explicit: true } => ({ ...expected, explicit: true });

const parseCases: ParseCase[] = [
  // Prefijo en progreso / awaitingLocal
  { input: '+67', expected: explicit({ prefix: '+67', digits: '', awaitingLocal: true }) },
  { input: '+7', expected: explicit({ prefix: '+7', digits: '' }) },
  { input: '+78', expected: explicit({ prefix: '+78', digits: '', awaitingLocal: true }) },
  { input: '+59', expected: explicit({ prefix: '+59', digits: '' }) },
  { input: '+593', expected: explicit({ prefix: '+593', digits: '', awaitingLocal: true }) },
  { input: '+678', expected: explicit({ prefix: '+678', digits: '', awaitingLocal: true }) },
  { input: '+57', expected: explicit({ prefix: '+57', digits: '', awaitingLocal: true }) },
  { input: '+78 ', expected: explicit({ prefix: '+78', digits: '', awaitingLocal: true }) },
  { input: '(+) 6', expected: explicit({ prefix: '+6', digits: '' }) },

  // Prefijo + número sin espacio manual
  { input: '+673', expected: explicit({ prefix: '+67', digits: '3' }) },
  { input: '+6789', expected: explicit({ prefix: '+678', digits: '9' }) },
  { input: '+573', expected: explicit({ prefix: '+57', digits: '3' }) },
  { input: '+5934123456', expected: explicit({ prefix: '+593', digits: '4123456' }) },
  { input: '+573001234567', expected: explicit({ prefix: '+57', digits: '3001234567' }) },
  {
    input: '+573001234567',
    options: { splitWithoutSpace: true },
    expected: explicit({ prefix: '+57', digits: '3001234567' }),
  },

  // Con espacio explícito
  {
    input: '+78 3013322',
    expected: explicit({ prefix: '+78', digits: '3013322', awaitingLocal: false }),
  },
  {
    input: '+58 4121234567',
    expected: explicit({ prefix: '+58', digits: '4121234567', awaitingLocal: false }),
  },

  // Sin + inicial
  { input: '3001234567', expected: { prefix: '', digits: '3001234567' } },
  { input: '584121234567', expected: { prefix: '+58', digits: '4121234567' } },

  // Formato visual (+XX)
  { input: '(+57) 3001234567', expected: explicit({ prefix: '+57', digits: '3001234567' }) },
  {
    input: '(+573) 013322950',
    expected: explicit({ prefix: '+57', digits: '3013322950' }),
  },
  { input: '573013322950', expected: { prefix: '+57', digits: '3013322950' } },

  // Pegado con splitWithoutSpace
  {
    input: '(+57) 3013322950',
    options: { splitWithoutSpace: true },
    expected: explicit({ prefix: '+57', digits: '3013322950' }),
  },
  {
    input: '(+57)3013322950',
    options: { splitWithoutSpace: true },
    expected: explicit({ prefix: '+57', digits: '3013322950' }),
  },
  {
    input: '+57)3013322950',
    options: { splitWithoutSpace: true },
    expected: explicit({ prefix: '+57', digits: '3013322950' }),
  },
];

describe('parsePhoneInput', () => {
  it.each(parseCases)('"$input"', ({ input, options, expected }) => {
    expect(parsePhoneInput(input, options)).toEqual(expected);
  });
});

describe('resolvePhonePrefix', () => {
  it.each([
    { prefix: '+67', digits: '', options: { explicit: true }, expected: '+67' },
    { prefix: '', digits: '3001234567', expected: DEFAULT_PHONE_PREFIX },
    { prefix: '+58', digits: '4121234567', options: { explicit: true }, expected: '+58' },
  ])('$prefix + $digits', ({ prefix, digits, options, expected }) => {
    expect(resolvePhonePrefix(prefix, digits, options)).toBe(expected);
  });
});

describe('serializePhoneValue', () => {
  it.each([
    { prefix: '', digits: '3001234567', expected: '573001234567' },
    { prefix: '+67', digits: '', options: { explicit: true }, expected: '' },
    { prefix: '+78', digits: '3013322', options: { explicit: true }, expected: '783013322' },
    { prefix: '+58', digits: '4121234567', options: { explicit: true }, expected: '584121234567' },
    { prefix: '+57', digits: '3001234567', options: { explicit: true }, expected: '573001234567' },
  ])('$prefix $digits → $expected', ({ prefix, digits, options, expected }) => {
    expect(serializePhoneValue(prefix, digits, options)).toBe(expected);
  });
});

describe('formatPhoneDisplay', () => {
  it.each([
    { digits: '', prefix: '+67', options: { explicit: true }, expected: '+67' },
    { digits: '', prefix: '+78', options: { explicit: true, awaitingLocal: true }, expected: '+78 ' },
    { digits: '', prefix: '+', options: { explicit: true }, expected: '+' },
    { digits: '3001234567', prefix: '', expected: '(+57) 3001234567' },
    { digits: '3013322', prefix: '+78', options: { explicit: true }, expected: '(+78) 3013322' },
  ])('"$expected"', ({ digits, prefix, options, expected }) => {
    expect(formatPhoneDisplay(digits, prefix, options)).toBe(expected);
  });
});

describe('deserializePhoneValue', () => {
  it.each([
    { stored: '573001234567', expected: { prefix: '+57', digits: '3001234567' } },
    { stored: '584121234567', expected: { prefix: '+58', digits: '4121234567' } },
  ])('$stored', ({ stored, expected }) => {
    expect(deserializePhoneValue(stored)).toEqual(expected);
  });
});
