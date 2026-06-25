import { Directive, ElementRef, HostListener, inject } from '@angular/core';

const ALLOWED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

@Directive({
  selector: 'input[appDateInputMask]',
  standalone: true,
})
export class DateInputMaskDirective {
  private readonly input = inject(ElementRef<HTMLInputElement>).nativeElement;

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (ALLOWED_KEYS.has(event.key) || event.ctrlKey || event.metaKey) return;
    if (event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('input')
  onInput(): void {
    const selectionStart = this.input.selectionStart ?? this.input.value.length;
    const digitsBeforeCursor = this.input.value.slice(0, selectionStart).replace(/\D/g, '').length;

    const digits = this.input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = formatDigitsToDate(digits);

    if (this.input.value === formatted) return;

    this.input.value = formatted;
    const newCursor = cursorAfterDigits(formatted, digitsBeforeCursor);
    this.input.setSelectionRange(newCursor, newCursor);
  }
}

function formatDigitsToDate(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function cursorAfterDigits(formatted: string, digitsCount: number): number {
  if (digitsCount <= 0) return 0;

  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen >= digitsCount) return i + 1;
    }
  }

  return formatted.length;
}
