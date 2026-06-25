import {
  Directive,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  DEFAULT_PHONE_PREFIX,
  applyPhoneInputFormatting,
  deserializePhoneValue,
  formatPhoneDisplay,
  isColombianLocalNumber,
  parsePhoneInput,
  resolvePhonePrefix,
  sanitizePhonePartialInput,
  serializePhoneValue,
} from '../utils/phone-input.utils';

@Directive({
  selector: 'input[appPhoneInputMask]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputMaskDirective),
      multi: true,
    },
  ],
})
export class PhoneInputMaskDirective implements ControlValueAccessor {
  private readonly input = inject(ElementRef<HTMLInputElement>).nativeElement;

  private prefix = '';
  private digits = '';
  private explicitPrefix = false;
  private awaitingLocal = false;
  private suppressInput = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    const parsed = deserializePhoneValue(String(value ?? ''));
    this.prefix = parsed.prefix;
    this.digits = parsed.digits;
    this.explicitPrefix = false;
    this.awaitingLocal = false;
    this.renderFormatted();
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
    if (this.suppressInput) return;

    const raw = this.input.value;

    if (!raw.trim()) {
      this.clear();
      return;
    }

    const parsed = parsePhoneInput(raw);
    this.applyParsed(parsed);

    if (!this.digits) {
      if (this.explicitPrefix) {
        this.showExplicitPrefixOnly();
        this.onChange('');
        return;
      }

      this.onChange('');
      this.setInputValue(sanitizePhonePartialInput(raw));
      return;
    }

    if (!this.explicitPrefix && !this.prefix) {
      if (isColombianLocalNumber(this.digits)) {
        this.prefix = DEFAULT_PHONE_PREFIX;
      } else {
        this.onChange('');
        this.setInputValue(this.digits);
        return;
      }
    }

    this.commitValue();
    this.renderFormatted();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const parsed = parsePhoneInput(pasted, { splitWithoutSpace: true });

    this.applyParsed(parsed);

    if (!this.digits) {
      if (this.explicitPrefix) {
        this.showExplicitPrefixOnly();
        this.onChange('');
        return;
      }
      this.clear();
      return;
    }

    if (!this.explicitPrefix && !this.prefix) {
      if (isColombianLocalNumber(this.digits)) {
        this.prefix = DEFAULT_PHONE_PREFIX;
      }
    }

    this.commitValue();
    this.renderFormatted();
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.digits) {
      if (!this.explicitPrefix && !this.prefix) {
        this.prefix = DEFAULT_PHONE_PREFIX;
      }
      this.commitValue();
      this.renderFormatted();
    } else if (!this.explicitPrefix) {
      this.clear();
    }

    this.onTouched();
  }

  private applyParsed(parsed: ReturnType<typeof parsePhoneInput>): void {
    this.explicitPrefix = parsed.explicit ?? false;
    this.awaitingLocal = parsed.awaitingLocal ?? false;
    this.prefix = parsed.prefix;
    this.digits = parsed.digits;
  }

  private displayOptions() {
    return { explicit: this.explicitPrefix, awaitingLocal: this.awaitingLocal };
  }

  private setInputValue(value: string): void {
    this.suppressInput = true;
    this.input.value = value;
    this.suppressInput = false;
  }

  private showExplicitPrefixOnly(): void {
    this.setInputValue(formatPhoneDisplay('', this.prefix, this.displayOptions()));
  }

  private commitValue(): void {
    const options = { explicit: this.explicitPrefix };
    this.prefix = resolvePhonePrefix(this.prefix, this.digits, options);
    this.onChange(serializePhoneValue(this.prefix, this.digits, options));
  }

  private clear(): void {
    this.prefix = '';
    this.digits = '';
    this.explicitPrefix = false;
    this.awaitingLocal = false;
    this.setInputValue('');
    this.onChange('');
  }

  private renderFormatted(): void {
    if (this.explicitPrefix && !this.digits) {
      this.showExplicitPrefixOnly();
      return;
    }

    if (!this.digits) return;

    const effectivePrefix = this.explicitPrefix
      ? this.prefix
      : this.prefix || DEFAULT_PHONE_PREFIX;

    this.suppressInput = true;
    applyPhoneInputFormatting(
      this.input,
      this.digits,
      effectivePrefix,
      this.displayOptions(),
    );
    this.suppressInput = false;
  }
}
