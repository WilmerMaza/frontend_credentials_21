import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { ES_DATE_INPUT_FORMAT } from '../constants/date-formats';

const DD_MM_YYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

@Injectable()
export class SpanishDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const match = DD_MM_YYYY.exec(trimmed);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        const date = this.createDate(year, month, day);
        return this.isValid(date) ? date : this.invalid();
      }
    }

    return super.parse(value, parseFormat);
  }

  override format(date: Date, displayFormat: Object): string {
    if (!this.isValid(date)) {
      throw new Error('NativeDateAdapter: Cannot format invalid date.');
    }

    if (displayFormat === ES_DATE_INPUT_FORMAT) {
      return `${this.pad(this.getDate(date))}/${this.pad(this.getMonth(date) + 1)}/${this.getYear(date)}`;
    }

    return super.format(date, displayFormat);
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
