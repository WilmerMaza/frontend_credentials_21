import { describe, expect, it } from 'vitest';
import {
  isCredentialExpired,
  resolveEffectiveCredentialStatus,
} from './credential-expiration.utils';

const today = new Date(2026, 5, 24); // 24/06/2026
const yesterday = new Date(2026, 5, 23);
const tomorrow = new Date(2026, 5, 25);

describe('isCredentialExpired', () => {
  it('retorna false sin fecha de expiración', () => {
    expect(isCredentialExpired(null, today)).toBe(false);
    expect(isCredentialExpired(undefined, today)).toBe(false);
  });

  it('retorna true si la vigencia es anterior a hoy', () => {
    expect(isCredentialExpired(yesterday, today)).toBe(true);
    expect(isCredentialExpired('2026-06-23T12:00:00.000Z', today)).toBe(true);
  });

  it('retorna false si la vigencia es hoy o futura', () => {
    expect(isCredentialExpired(today, today)).toBe(false);
    expect(isCredentialExpired(tomorrow, today)).toBe(false);
  });

  it('parsea vigencia en formato DD/MM/YYYY', () => {
    expect(isCredentialExpired('23/06/2026', today)).toBe(true);
    expect(isCredentialExpired('25/06/2026', today)).toBe(false);
  });
});

describe('resolveEffectiveCredentialStatus', () => {
  it('eleva ACTIVE vencido a EXPIRED', () => {
    expect(resolveEffectiveCredentialStatus('ACTIVE', yesterday, today)).toBe('EXPIRED');
    expect(resolveEffectiveCredentialStatus('ACTIVO', yesterday, today)).toBe('EXPIRED');
  });

  it('mantiene ACTIVE si la vigencia es hoy o futura', () => {
    expect(resolveEffectiveCredentialStatus('ACTIVE', today, today)).toBe('ACTIVE');
    expect(resolveEffectiveCredentialStatus('ACTIVE', tomorrow, today)).toBe('ACTIVE');
  });

  it('no cambia PENDING aunque esté vencido', () => {
    expect(resolveEffectiveCredentialStatus('PENDING', yesterday, today)).toBe('PENDING');
    expect(resolveEffectiveCredentialStatus('PENDIENTE', yesterday, today)).toBe('PENDING');
  });

  it('respeta estados ya expirados o trasladados', () => {
    expect(resolveEffectiveCredentialStatus('EXPIRED', tomorrow, today)).toBe('EXPIRED');
    expect(resolveEffectiveCredentialStatus('TRANSFERRED', yesterday, today)).toBe('TRANSFERRED');
  });
});
