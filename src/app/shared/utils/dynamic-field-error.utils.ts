import type { CredentialFieldSchema } from '../../core/models/credential-type.model';

/** Mensajes de validación genéricos a partir del schema (label + type). */
export function getDynamicFieldErrorMessage(
  field: CredentialFieldSchema,
  errors: Record<string, unknown>,
): string | null {
  if (errors['required']) {
    return getRequiredMessage(field);
  }
  if (errors['email']) {
    return `«${field.label}» debe ser un correo válido`;
  }
  if (errors['minlength']) {
    const min = (errors['minlength'] as { requiredLength: number }).requiredLength;
    return `«${field.label}» requiere al menos ${min} caracteres`;
  }
  if (errors['maxlength']) {
    const max = (errors['maxlength'] as { requiredLength: number }).requiredLength;
    return `«${field.label}» admite máximo ${max} caracteres`;
  }
  if (errors['min']) {
    const min = (errors['min'] as { min: number }).min;
    return `«${field.label}» debe ser mayor o igual a ${min}`;
  }
  if (errors['max']) {
    const max = (errors['max'] as { max: number }).max;
    return `«${field.label}» no puede ser mayor a ${max}`;
  }
  if (errors['pattern']) {
    return `El formato de «${field.label}» no es válido`;
  }

  return null;
}

function getRequiredMessage(field: CredentialFieldSchema): string {
  const label = field.label;

  switch (field.type) {
    case 'select':
    case 'radio':
      return `Seleccione una opción en «${label}»`;
    case 'checkbox':
      return `Seleccione al menos una opción en «${label}»`;
    case 'boolean':
      return `Debe confirmar «${label}»`;
    case 'date':
      return `Seleccione «${label}»`;
    case 'email':
      return `Complete «${label}»`;
    default:
      return `Complete «${label}»`;
  }
}
