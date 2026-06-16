import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
import { Subscription } from 'rxjs';
import type {
  CredentialFieldOption,
  CredentialFieldOptionGroup,
  CredentialFieldSchema,
  CredentialTypeSchema,
} from '../../../../../core/models/credential-type.model';
import {
  CADETE_ASPIRANT_DEFAULTS,
  normalizeCadeteDetailValues,
} from '../../../../../shared/utils/cadete-schema.utils';
import { getDynamicFieldErrorMessage } from '../../../../../shared/utils/dynamic-field-error.utils';
import { institutionalEmailValidator } from '../../../../../shared/utils/registration-validation.utils';

const FIELD_ICONS: Record<string, string> = {
  force: 'shield',
  category: 'category',
  grades: 'military_tech',
  grado: 'military_tech',
  unit: 'groups',
  compania: 'groups',
  department: 'apartment',
  position: 'work',
  sport: 'sports',
  course: 'school',
  curso: 'school',
};

const OPTION_LABELS: Record<string, string> = {
  armada: 'Armada',
  ejercito: 'Ejército',
  fuerza_aerea: 'Fuerza Aérea',
  policia_nacional: 'Policía Nacional',
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  grades: 'Ej: Teniente, Sargento...',
  grado: 'Seleccione grado',
  unit: 'Ej: Batallón de Infantería',
  compania: 'Seleccione compañía',
  department: 'Ej: Dirección Académica',
  position: 'Ej: Analista administrativo',
  sport: 'Ej: Natación, Atletismo...',
  course: 'Seleccione curso',
  curso: 'Seleccione curso',
};

/** Si el API usa dependsOn legacy (grades, company…), leer el control canónico. */
const PARENT_FIELD_ALIASES: Record<string, string[]> = {
  grado: ['grades', 'rank'],
  compania: ['company', 'unit', 'sport'],
  curso: ['course'],
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
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) group!: FormGroup;
  @Input() schema: CredentialTypeSchema | null = null;
  @Input() initialValues: Record<string, unknown> | null = null;

  fields: CredentialFieldSchema[] = [];

  private cascadeTeardown?: () => void;

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
    return this.resolveOptionLabel(field, option);
  }

  isFullWidthField(field: CredentialFieldSchema): boolean {
    return (
      field.type === 'textarea' ||
      field.type === 'radio' ||
      field.type === 'checkbox' ||
      field.type === 'boolean'
    );
  }

  isFieldVisible(field: CredentialFieldSchema): boolean {
    if (field.hiddenWhen) {
      const refValue = String(this.group.get(field.hiddenWhen.field)?.value ?? '')
        .trim()
        .toLowerCase();
      const hiddenValues = field.hiddenWhen.values.map((value) => value.trim().toLowerCase());
      if (hiddenValues.includes(refValue)) return false;
    }

    if (field.dependsOn) {
      const parentValue = this.getParentValue(field);
      if (!parentValue) return false;
    }

    return true;
  }

  getOptionGroups(field: CredentialFieldSchema): CredentialFieldOptionGroup[] {
    const parentValue = this.getParentValue(field);
    if (!parentValue || !field.optionGroupsByParent) return [];

    const groups =
      field.optionGroupsByParent[parentValue] ??
      field.optionGroupsByParent[
        Object.keys(field.optionGroupsByParent).find(
          (key) => key.toLowerCase() === parentValue.toLowerCase(),
        ) ?? ''
      ];

    return groups ?? [];
  }

  hasOptionGroups(field: CredentialFieldSchema): boolean {
    return this.getOptionGroups(field).length > 0;
  }

  getSelectOptions(field: CredentialFieldSchema): CredentialFieldOption[] {
    const groups = this.getOptionGroups(field);
    if (groups.length > 0) {
      return groups.flatMap((group) => group.options);
    }

    const parentValue = this.getParentValue(field);
    if (field.dependsOn) {
      if (!parentValue) return [];

      const parentOptions = this.resolveOptionsByParent(field.optionsByParent, parentValue);
      const values =
        parentOptions && parentOptions.length > 0 ? parentOptions : (field.options ?? []);

      return values.map((value) => ({
        value,
        label: this.resolveOptionLabel(field, value),
      }));
    }

    return (field.options ?? []).map((value) => ({
      value,
      label: this.resolveOptionLabel(field, value),
    }));
  }

  getChoiceOptions(field: CredentialFieldSchema): string[] {
    return this.getSelectOptions(field).map((option) => option.value);
  }

  getFieldError(field: CredentialFieldSchema): string | null {
    if (!this.isFieldVisible(field)) return null;
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
    this.cascadeTeardown?.();

    Object.keys(this.group.controls).forEach((key) => {
      this.group.removeControl(key);
    });

    this.fields = this.schema?.fields ?? [];
    const values = this.normalizeInitialValues(this.initialValues);

    for (const field of this.fields) {
      const control = this.createControl(field);
      const initial = values[field.name];
      if (initial !== undefined) {
        control.setValue(initial);
      }
      this.group.addControl(field.name, control);
    }

    this.setupCascadeHandlers();
    this.group.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  private normalizeInitialValues(
    source: Record<string, unknown> | null,
  ): Record<string, unknown> {
    return normalizeCadeteDetailValues(source);
  }

  private setupCascadeHandlers(): void {
    const subs: Subscription[] = [];

    for (const field of this.fields) {
      const control = this.group.get(field.name);
      if (!control) continue;

      subs.push(
        control.valueChanges.subscribe(() => {
          if (this.fields.some((item) => item.dependsOn === field.name)) {
            this.resetDependentFields(field.name);
          }
          this.applyAllCascadeRules();
        }),
      );
    }

    this.cascadeTeardown = () => subs.forEach((sub) => sub.unsubscribe());
    this.applyAllCascadeRules();
  }

  private resetDependentFields(parentName: string): void {
    for (const fieldName of this.getDependentFieldNames(parentName)) {
      const field = this.fields.find((item) => item.name === fieldName);
      const control = this.group.get(fieldName);
      if (!field || !control) continue;
      control.reset(this.defaultValueForField(field), { emitEvent: false });
    }
  }

  private getDependentFieldNames(rootParent: string): string[] {
    const result: string[] = [];
    const queue = [rootParent];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const parent = queue.shift()!;
      for (const field of this.fields) {
        if (field.dependsOn !== parent || seen.has(field.name)) continue;
        seen.add(field.name);
        result.push(field.name);
        queue.push(field.name);
      }
    }

    return result;
  }

  private applyAllCascadeRules(): void {
    for (const field of this.fields) {
      this.applyFieldCascadeRules(field);
    }
    for (const field of this.fields) {
      this.applyFieldCascadeRules(field);
    }
    this.applyCadeteAspirantDefaults();
    this.cdr.markForCheck();
  }

  private applyFieldCascadeRules(field: CredentialFieldSchema): void {
    const control = this.group.get(field.name);
    if (!control) return;

    if (!this.isFieldVisible(field)) {
      const autoValue = this.getAutoValue(field);
      if (autoValue !== undefined) {
        control.setValue(autoValue, { emitEvent: false });
      }
      control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
      return;
    }

    control.setValidators(this.buildValidators(field));
    this.applyAutoValueIfNeeded(field, control as FormControl);

    if (field.type === 'select' || field.type === 'radio') {
      this.syncSelectValue(field, control as FormControl);
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private applyAutoValueIfNeeded(field: CredentialFieldSchema, control: FormControl): void {
    const autoValue = this.getAutoValue(field);
    if (autoValue === undefined) return;

    const current = String(control.value ?? '').trim();
    if (current) return;

    const hasDependents = this.fields.some((item) => item.dependsOn === field.name);
    control.setValue(autoValue, { emitEvent: hasDependents });
  }

  private applyCadeteAspirantDefaults(): void {
    const gradoCtrl = this.group.get('grado');
    if (!gradoCtrl) return;

    const grado = String(gradoCtrl.value ?? '').trim().toLowerCase();
    if (grado !== CADETE_ASPIRANT_DEFAULTS.grado) return;

    const companiaCtrl = this.group.get('compania');
    const cursoCtrl = this.group.get('curso');

    if (companiaCtrl && !String(companiaCtrl.value ?? '').trim()) {
      companiaCtrl.setValue(CADETE_ASPIRANT_DEFAULTS.compania, { emitEvent: false });
    }

    if (cursoCtrl && !String(cursoCtrl.value ?? '').trim()) {
      cursoCtrl.setValue(CADETE_ASPIRANT_DEFAULTS.curso, { emitEvent: false });
    }

    for (const field of this.fields) {
      if (field.name === 'compania' || field.name === 'curso') {
        this.applyFieldCascadeRules(field);
      }
    }
  }

  private syncSelectValue(field: CredentialFieldSchema, control: FormControl): void {
    const options = this.getSelectOptions(field);
    const allowed = new Set(options.map((option) => option.value));
    const current = String(control.value ?? '').trim();
    if (!current || allowed.size === 0) return;

    if (allowed.has(current)) return;

    const caseMatch = options.find(
      (option) => option.value.toLowerCase() === current.toLowerCase(),
    );
    if (caseMatch) {
      control.setValue(caseMatch.value, { emitEvent: false });
      return;
    }

    const labelMatch = options.find(
      (option) => option.label.trim().toLowerCase() === current.toLowerCase(),
    );
    if (labelMatch) {
      control.setValue(labelMatch.value, { emitEvent: false });
      return;
    }

    control.reset(this.defaultValueForField(field), { emitEvent: false });
  }

  private getParentValue(field: CredentialFieldSchema): string {
    if (!field.dependsOn) return '';

    const direct = String(this.group.get(field.dependsOn)?.value ?? '').trim();
    if (direct) return direct;

    const aliases = PARENT_FIELD_ALIASES[field.dependsOn] ?? [];
    for (const alias of aliases) {
      const value = String(this.group.get(alias)?.value ?? '').trim();
      if (value) return value;
    }

    return '';
  }

  private getAutoValue(field: CredentialFieldSchema): string | undefined {
    if (!field.autoValueWhen) return undefined;
    const refValue = String(this.group.get(field.autoValueWhen.field)?.value ?? '').trim();
    if (!refValue) return undefined;

    const values = field.autoValueWhen.values;
    if (values[refValue] !== undefined) return values[refValue];

    const matchedKey = Object.keys(values).find(
      (key) => key.toLowerCase() === refValue.toLowerCase(),
    );
    return matchedKey ? values[matchedKey] : undefined;
  }

  private resolveOptionsByParent(
    map: Record<string, string[]> | undefined,
    parentValue: string,
  ): string[] | undefined {
    if (!map || !parentValue) return undefined;
    if (map[parentValue]?.length) return map[parentValue];

    const matchedKey = Object.keys(map).find(
      (key) => key.toLowerCase() === parentValue.toLowerCase(),
    );
    return matchedKey ? map[matchedKey] : undefined;
  }

  private resolveOptionLabel(field: CredentialFieldSchema, option: string): string {
    if (field.optionLabels?.[option]) return field.optionLabels[option];
    if (OPTION_LABELS[option]) return OPTION_LABELS[option];
    if (field.name === 'course' || field.name === 'curso') return option;
    return option
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private defaultValueForField(field: CredentialFieldSchema): unknown {
    if (field.type === 'checkbox') return [];
    if (field.type === 'boolean') return false;
    return field.defaultValue ?? '';
  }

  private createControl(field: CredentialFieldSchema): FormControl {
    const validators = this.buildValidators(field);
    const initialValue = this.defaultValueForField(field);

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
