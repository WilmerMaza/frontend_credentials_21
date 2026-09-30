const RETURN_URL_KEY = 'auth.returnUrl';

function isSafeInternalUrl(url: string): boolean {
  return (
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/\\') &&
    !url.startsWith('/login')
  );
}

/** Guarda la ruta pedida en la pestaña, fuera de la URL de login. */
export function rememberReturnUrl(url: string): void {
  const value = url.trim();
  if (!isSafeInternalUrl(value)) return;

  try {
    sessionStorage.setItem(RETURN_URL_KEY, value);
  } catch {
    /* modo privado o almacenamiento bloqueado: el login irá al inicio */
  }
}

/** Lee y olvida la ruta guardada. Si no hay una válida, vuelve al inicio. */
export function consumeReturnUrl(): string {
  try {
    const value = sessionStorage.getItem(RETURN_URL_KEY)?.trim() ?? '';
    sessionStorage.removeItem(RETURN_URL_KEY);
    return isSafeInternalUrl(value) ? value : '/';
  } catch {
    return '/';
  }
}
