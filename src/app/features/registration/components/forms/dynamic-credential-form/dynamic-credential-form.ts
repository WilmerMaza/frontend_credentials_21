import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import type {
  CredentialFieldSchema,
  CredentialTypeSchema,
} from '../../../../../core/models/credential-type.model';
import { getDynamicFieldErrorMessage } from '../../../../../shared/utils/dynamic-field-error.utils';
import { institutionalEmailValidator } from '../../../../../shared/utils/registration-validation.utils';

const FIELD_ICONS: Record<string, string> = {
  force: 'shield',
  grades: 'military_tech',
  unit: 'groups',
  department: 'apartment',
  position: 'work',
  sport: 'sports',
  course: 'school',
};

const OPTION_LABELS: Record<string, string> = {
  armada: 'Armada',
  ejercito: 'Ejército',
  fuerza_aerea: 'Fuerza Aérea',
  policia_nacional: 'Policía Nacional',
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  grades: 'Ej: Teniente, Sargento...',
  unit: 'Ej: Batallón de Infantería',
  department: 'Ej: Dirección Académica',
  position: 'Ej: Analista administrativo',
  sport: 'Ej: Natación, Atletismo...',
};

@Component({
  selector: 'app-dynamic-credential-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './dynamic-credential-form.html',
  styleUrl: './dynamic-credential-form.scss',
})
export class DynamicCredentialForm implements OnChanges {
  @Input({ required: true }) group!: FormGroup;
  @Input() schema: CredentialTypeSchema | null = null;
  @Input() initialValues: Record<string, unknown> | null = null;

  fields: CredentialFieldSchema[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] || changes['initialValues']) {
      this.rebuildForm();
    }
  }

  fieldIcon(field: CredentialFieldSchema): string {
    if (FIELD_ICONS[field.name]) return FIELD_ICONS[field.name];

    switch (field.type) {
      case 'email':
        return 'email';
      case 'date':
        return 'calendar_month';
      case 'number':
        return 'numbers';
      case 'textarea':
        return 'notes';
      case 'select':
        return 'list';
      case 'radio':
        return 'radio_button_checked';
      case 'checkbox':
        return 'checklist';
      case 'boolean':
        return 'toggle_on';
      default:
        return 'edit';
    }
  }

  fieldLabel(field: CredentialFieldSchema): string {
    return field.required ? `${field.label} *` : field.label;
  }

  fieldPlaceholder(field: CredentialFieldSchema): string {
    if (FIELD_PLACEHOLDERS[field.name]) return FIELD_PLACEHOLDERS[field.name];

    switch (field.type) {
      case 'email':
        return 'usuario@institucion.edu.co';
      case 'date':
        return '';
      case 'select':
        return `Seleccione ${field.label.toLowerCase()}`;
      case 'number':
        return 'Ej: 0';
      default:
        return `Ingrese ${field.label.toLowerCase()}`;
    }
  }

  optionLabel(field: CredentialFieldSchema, option: string): string {
    if (OPTION_LABELS[option]) return OPTION_LABELS[option];
    if (field.name === 'course') return `Curso ${option}`;
    return option
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  isFullWidthField(field: CredentialFieldSchema): boolean {
    return (
      field.type === 'textarea' ||
      field.type === 'radio' ||
      field.type === 'checkbox' ||
      field.type === 'boolean'
    );
  }

  getFieldError(field: CredentialFieldSchema): string | null {
    const control = this.group.controls[field.name];
    if (!control?.touched || !control.errors) return null;
    return getDynamicFieldErrorMessage(field, control.errors);
  }

  toggleCheckbox(fieldName: string, option: string, checked: boolean): void {
    const control = this.group.controls[fieldName];
    const current = Array.isArray(control.value) ? [...control.value] : [];
    const next = checked
      ? [...new Set([...current, option])]
      : current.filter((value) => value !== option);

    control.setValue(next);
    control.markAsDirty();
    control.markAsTouched();
  }

  private rebuildForm(): void {
    Object.keys(this.group.controls).forEach((key) => {
      this.group.removeControl(key);
    });

    this.fields = this.schema?.fields ?? [];

    for (const field of this.fields) {
      const control = this.createControl(field);
      const initial = this.initialValues?.[field.name];
      if (initial !== undefined) {
        control.setValue(initial);
      }
      this.group.addControl(field.name, control);
    }
  }

  private createControl(field: CredentialFieldSchema): FormControl {
    const validators = this.buildValidators(field);
    const initialValue = field.type === 'checkbox' ? [] : field.type === 'boolean' ? false : '';

    return new FormControl(initialValue, {
      nonNullable: field.type !== 'boolean',
      validators,
    });
  }

  private buildValidators(field: CredentialFieldSchema): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }

    if (field.type === 'email') {
      validators.push(institutionalEmailValidator());
    }

    if (field.minLength !== undefined) {
      validators.push(Validators.minLength(field.minLength));
    }

    if (field.maxLength !== undefined) {
      validators.push(Validators.maxLength(field.maxLength));
    }

    if (field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }

    if (field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }

    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }

    return validators;
  }
}
