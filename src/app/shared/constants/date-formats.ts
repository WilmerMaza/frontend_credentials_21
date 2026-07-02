import type { MatDateFormats } from '@angular/material/core';

/** Token usado por SpanishDateAdapter para parseo y visualización dd/MM/yyyy. */
export const ES_DATE_INPUT_FORMAT = 'DD/MM/YYYY';

export const ES_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: ES_DATE_INPUT_FORMAT,
  },
  display: {
    dateInput: ES_DATE_INPUT_FORMAT,
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
