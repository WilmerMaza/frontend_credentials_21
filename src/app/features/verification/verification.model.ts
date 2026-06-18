import type { CredentialDetails } from '../personal-registrado/models/personal-item.model';

export type VerificationOutcome =
  | 'VALID'
  | 'PENDING'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'NOT_FOUND';

export interface PublicCredentialSnapshot {
  fullName: string;
  identityNumber: string;
  typeIdentity: string;
  birthDate?: string | null;
  institutionalEmail?: string | null;
  credentialTypeCode: string;
  credentialTypeName: string;
  metadata: CredentialDetails;
  imageFilename?: string | null;
  status: string;
  issueDate?: string | null;
  expirationDate?: string | null;
}

export interface PublicVerificationResponse {
  outcome: VerificationOutcome;
  valid: boolean;
  message: string;
  checkedAt: string;
  credential?: PublicCredentialSnapshot | null;
}
