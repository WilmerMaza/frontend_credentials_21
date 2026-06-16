export type CredentialFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'email'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean';

export interface CredentialFieldOption {
  value: string;
  label: string;
}

export interface CredentialFieldOptionGroup {
  name: string;
  options: CredentialFieldOption[];
}

export interface CredentialFieldHiddenWhen {
  field: string;
  values: string[];
}

export interface CredentialFieldAutoValueWhen {
  field: string;
  values: Record<string, string>;
}

export interface CredentialFieldSchema {
  name: string;
  label: string;
  type: CredentialFieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  dependsOn?: string;
  optionsByParent?: Record<string, string[]>;
  optionGroupsByParent?: Record<string, CredentialFieldOptionGroup[]>;
  optionLabels?: Record<string, string>;
  hiddenWhen?: CredentialFieldHiddenWhen;
  autoValueWhen?: CredentialFieldAutoValueWhen;
  /** Valor inicial cuando no hay initialValues ni valor del usuario. */
  defaultValue?: string;
}

export interface CredentialTypeSchema {
  fields: CredentialFieldSchema[];
}

export interface CredentialTypeApiResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  schema: CredentialTypeSchema;
}
