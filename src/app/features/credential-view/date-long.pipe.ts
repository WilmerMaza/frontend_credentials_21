import { Pipe, PipeTransform } from '@angular/core';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Pipe({ name: 'dateLong', standalone: true })
export class DateLongPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '-';
    try {
      const parts = value.split(/[\/\-\.]/);
      if (parts.length >= 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parts[2];
        if (m >= 0 && m < 12) {
          return `${d} de ${MESES[m]} de ${y}`;
        }
      }
    } catch {}
    return value;
  }
}
