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
    @if (isMobile()) {
      <section class="card">
        <div class="accordion">
          <button type="button" class="accordion-head" (click)="toggleFilters()">
            <div class="accordion-left">
              <span class="filter-dot">
                <mat-icon>filter_list</mat-icon>
              </span>
              <span class="accordion-title">Filtros de búsqueda</span>
            </div>
            <span class="chev" [class.chev--open]="filtersExpanded()">
              <mat-icon>expand_more</mat-icon>
            </span>
          </button>
          @if (filtersExpanded()) {
            <div class="accordion-body">
              <div class="field">
                <mat-icon>search</mat-icon>
                <input
                  type="text"
                  [formControl]="$any(searchForm().get('nombre'))"
                  placeholder="Buscar nombre o apellido"
                />
              </div>
              <div class="field">
                <mat-icon>mail</mat-icon>
                <input
                  type="text"
                  [formControl]="$any(searchForm().get('correo'))"
                  placeholder="Correo institucional"
                />
              </div>
              <div class="field">
                <mat-icon>badge</mat-icon>
                <input
                  type="text"
                  [formControl]="$any(searchForm().get('identificacion'))"
                  placeholder="Número de identificación"
                />
              </div>
              <div class="field field--select">
                <mat-icon>flag</mat-icon>
                <select [formControl]="$any(searchForm().get('estado'))">
                  <option value="">Todos los estados</option>
                  @for (option of statusOptions(); track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </div>
              <div class="btn-row">
                <button type="button" class="btn primary" (click)="search.emit()">
                  <mat-icon>filter_list</mat-icon>
                  Buscar
                </button>
                <button type="button" class="btn ghost" (click)="clearSearch.emit()">Limpiar</button>
              </div>
            </div>
          }
        </div>
        <button class="cta" (click)="register.emit()">
          <span class="cta-ico">+</span>
          Registrar nuevo personal
        </button>
      </section>
    } @else {
      <div class="pr-filters-accordion">
        <button
          type="button"
          class="pr-filters-trigger"
          (click)="toggleFilters()"
          [attr.aria-expanded]="filtersExpanded()"
          aria-controls="pr-filters-content"
        >
          <mat-icon>filter_list</mat-icon>
          <span>Filtros de búsqueda</span>
          <mat-icon class="pr-filters-chevron">{{ filtersExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
        </button>
        <div
          id="pr-filters-content"
          class="pr-filters"
          [class.pr-filters--expanded]="filtersExpanded()"
        >
          <div class="pr-field">
            <mat-icon>search</mat-icon>
            <input
              type="text"
              [formControl]="$any(searchForm().get('nombre'))"
              placeholder="Buscar nombre o apellido"
            />
          </div>
          <div class="pr-field">
            <mat-icon>mail</mat-icon>
            <input
              type="text"
              [formControl]="$any(searchForm().get('correo'))"
              placeholder="Correo institucional"
            />
          </div>
          <div class="pr-field">
            <mat-icon>badge</mat-icon>
            <input
              type="text"
              [formControl]="$any(searchForm().get('identificacion'))"
              placeholder="Número de identificación"
            />
          </div>
          <div class="pr-field pr-field--select">
            <mat-icon>flag</mat-icon>
            <select [formControl]="$any(searchForm().get('estado'))">
              <option value="">Todos los estados</option>
              @for (option of statusOptions(); track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
          <button type="button" class="pr-btn primary" (click)="search.emit()">
            <mat-icon>filter_list</mat-icon>
            Buscar
          </button>
          <button type="button" class="pr-btn" (click)="clearSearch.emit()">Limpiar</button>
        </div>
      </div>
    }
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

  toggleFilters(): void {
    this.filtersExpanded.update((v) => !v);
  }
}
