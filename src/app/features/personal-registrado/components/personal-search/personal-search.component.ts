import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { CredentialStatusCode } from '../../../../shared/utils/credential-status.utils';

export interface StatusFilterOption {
  value: CredentialStatusCode;
  label: string;
}

@Component({
  selector: 'app-personal-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  styleUrls: ['./personal-search.component.scss'],
  template: `
    <section
      class="filters"
      [class.filters--mobile]="isMobile()"
      [class.filters--collapsed]="!filtersExpanded()"
    >
      <div
        id="personal-filters-panel"
        class="filters-panel"
        [class.filters-panel--expanded]="filtersExpanded()"
      >
        <div class="filters-grid">
          <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input
              matInput
              type="text"
              [formControl]="$any(searchForm().get('nombre'))"
              placeholder="Buscar por nombre o apellido..."
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
            <mat-icon matPrefix aria-hidden="true">mail</mat-icon>
            <input
              matInput
              type="text"
              [formControl]="$any(searchForm().get('correo'))"
              placeholder="Correo institucional"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
            <mat-icon matPrefix aria-hidden="true">badge</mat-icon>
            <input
              matInput
              type="text"
              [formControl]="$any(searchForm().get('identificacion'))"
              placeholder="Identificación"
            />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="filter-field filter-field--select"
            subscriptSizing="dynamic"
            floatLabel="always"
          >
            <mat-label>Estado</mat-label>
            <mat-select [formControl]="$any(searchForm().get('estado'))">
              <mat-option value="">Todos los estados</mat-option>
              @for (option of statusOptions(); track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="filter-actions">
            <button
              mat-stroked-button
              color="primary"
              type="button"
              class="filter-btn filter-btn--search"
              (click)="search.emit()"
            >
              <mat-icon>search</mat-icon>
              Buscar
            </button>
            <button
              mat-button
              color="primary"
              type="button"
              class="filter-btn filter-btn--clear"
              (click)="clearSearch.emit()"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PersonalSearchComponent {
  isMobile = input<boolean>(false);
  searchForm = input.required<FormGroup<any>>();
  statusOptions = input<StatusFilterOption[]>([]);
  filtersExpanded = model<boolean>(false);

  search = output<void>();
  clearSearch = output<void>();
  /** Conservado por compatibilidad; el CTA móvil vive en la página. */
  register = output<void>();
}
