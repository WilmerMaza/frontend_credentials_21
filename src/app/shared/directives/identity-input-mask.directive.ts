import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  applyIdentityInputFormatting,
  parseIdentityInput,
  resolveIdTypeFromPrefix,
  type IdentityIdType,
} from '../utils/identity-input.utils';
import { FormControl } from '@angular/forms';
import { sanitizeDigitsInput } from '../utils/registration-validation.utils';

@Directive({
  selector: 'input[appIdentityInputMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IdentityInputMaskDirective),
      multi: true,
    },
  ],
})
export class IdentityInputMaskDirective implements ControlValueAccessor, OnChanges {
  private readonly input = inject(ElementRef<HTMLInputElement>).nativeElement;

  /** Si el usuario escribe CC/TI/etc. en el número, se autocompleta el tipo. */
  @Input() identityIdTypeControl?: FormControl<IdentityIdType | ''> | null;

  private digits = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(): void {
    this.render();
  }

  writeValue(value: unknown): void {
    this.digits = sanitizeDigitsInput(String(value ?? ''));
    this.render();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  @HostListener('input')
  onInput(): void {
    const { prefix, digits } = parseIdentityInput(this.input.value);
    const detectedType = resolveIdTypeFromPrefix(prefix);
    const idTypeCtrl = this.identityIdTypeControl;

    if (detectedType && idTypeCtrl && !idTypeCtrl.value) {
      idTypeCtrl.setValue(detectedType, { emitEvent: true });
    }

    this.digits = digits;
    this.onChange(digits);
    this.render();
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private render(): void {
    applyIdentityInputFormatting(this.input, this.digits);
  }
}
