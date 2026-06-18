import {
  mapCredentialToPersonalItem,
  type CredentialApiResponse,
} from '../personal-registrado/models/personal-item.model';
import {
  deriveValidoHasta,
  mapPersonalItemToCredentialData,
} from '../credential-view/credential-mapper';
import type { CredentialData } from '../credential-view/credential-data.types';
import type {
  PublicCredentialSnapshot,
  PublicVerificationResponse,
  VerificationOutcome,
} from './verification.model';

export interface VerificationViewModel {
  outcome: VerificationOutcome;
  valid: boolean;
  message: string;
  checkedAt: string;
  credential: CredentialData | null;
  photoFilename?: string;
}

function formatDisplayDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function mapSnapshotToApiResponse(snapshot: PublicCredentialSnapshot): CredentialApiResponse {
  const issueDate = snapshot.issueDate ?? new Date().toISOString();

  return {
    id: 'public-verify',
    fullName: snapshot.fullName,
    identityNumber: snapshot.identityNumber,
    typeIdentity: snapshot.typeIdentity,
    birthDate: snapshot.birthDate ?? undefined,
    institutionalEmail: snapshot.institutionalEmail ?? '',
    credentialTypeCode: snapshot.credentialTypeCode,
    credentialTypeName: snapshot.credentialTypeName,
    metadata: snapshot.metadata,
    status: snapshot.status,
    expirationDate: snapshot.expirationDate ?? undefined,
    createdAt: issueDate,
    updatedAt: issueDate,
    imagePath: snapshot.imageFilename
      ? `uploads/credentials/${snapshot.imageFilename}`
      : undefined,
  };
}

export function mapVerificationResponse(
  response: PublicVerificationResponse,
): VerificationViewModel {
  if (!response.credential) {
    return {
      outcome: response.outcome,
      valid: response.valid,
      message: response.message,
      checkedAt: response.checkedAt,
      credential: null,
    };
  }

  const apiItem = mapSnapshotToApiResponse(response.credential);
  const personalItem = mapCredentialToPersonalItem(apiItem);
  const emision = formatDisplayDate(response.credential.issueDate) ?? personalItem.fechaIngreso;
  const validoHasta =
    formatDisplayDate(response.credential.expirationDate) ??
    deriveValidoHasta(personalItem.fechaIngreso);

  const credential = mapPersonalItemToCredentialData({
    ...personalItem,
    emision,
    validoHasta,
  });

  credential.verificacion.verificado = response.valid;

  return {
    outcome: response.outcome,
    valid: response.valid,
    message: response.message,
    checkedAt: response.checkedAt,
    credential,
    photoFilename: response.credential.imageFilename ?? undefined,
  };
}
