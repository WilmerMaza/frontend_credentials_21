import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import type { CredentialStatusCode } from '../../../../shared/utils/credential-status.utils';

export interface StatusFilterOption {
  value: CredentialStatusCode;
  label: string;
}

@Component({
  selector: 'app-personal-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  styleUrls: ['./personal-search.component.scss'],
  template: `
    <section class="filters" [class.filters--mobile]="isMobile()">
      <div class="filters-accordion">
        <button
          type="button"
          class="filters-trigger"
          (click)="toggleFilters()"
          [attr.aria-expanded]="filtersExpanded()"
          aria-controls="personal-filters-panel"
        >
          <span class="filters-trigger__left">
            <span class="filters-trigger__icon" aria-hidden="true">
              <mat-icon>filter_list</mat-icon>
            </span>
            <span class="filters-trigger__title">Filtros de búsqueda</span>
          </span>
          <span class="filters-trigger__chev" [class.filters-trigger__chev--open]="filtersExpanded()">
            <mat-icon>expand_more</mat-icon>
          </span>
        </button>

        <div
          id="personal-filters-panel"
          class="filters-panel"
          [class.filters-panel--expanded]="filtersExpanded() || !isCollapsible()"
        >
          <div class="filters-grid">
            <label class="filter-field">
              <mat-icon aria-hidden="true">search</mat-icon>
              <input
                type="text"
                [formControl]="$any(searchForm().get('nombre'))"
                placeholder="Buscar nombre o apellido"
              />
            </label>

            <label class="filter-field">
              <mat-icon aria-hidden="true">mail</mat-icon>
              <input
                type="text"
                [formControl]="$any(searchForm().get('correo'))"
                placeholder="Correo institucional"
              />
            </label>

            <label class="filter-field">
              <mat-icon aria-hidden="true">badge</mat-icon>
              <input
                type="text"
                [formControl]="$any(searchForm().get('identificacion'))"
                placeholder="Número de identificación"
              />
            </label>

            <label class="filter-field filter-field--select">
              <mat-icon aria-hidden="true">flag</mat-icon>
              <select [formControl]="$any(searchForm().get('estado'))">
                <option value="">Todos los estados</option>
                @for (option of statusOptions(); track option.value) {
                  <option [value]="option.value">{{ option.label }}</option>
                }
              </select>
            </label>

            <div class="filter-actions">
              <button type="button" class="filter-btn filter-btn--primary" (click)="search.emit()">
                <mat-icon>filter_list</mat-icon>
                Buscar
              </button>
              <button type="button" class="filter-btn" (click)="clearSearch.emit()">Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      @if (isMobile()) {
        <button type="button" class="filters-cta" (click)="register.emit()">
          <span class="filters-cta__icon" aria-hidden="true">+</span>
          Registrar nuevo personal
        </button>
      }
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
  register = output<void>();

  isCollapsible(): boolean {
    return this.isMobile();
  }

  toggleFilters(): void {
    if (!this.isCollapsible()) return;
    this.filtersExpanded.update((v) => !v);
  }
}
