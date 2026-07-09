import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { onCredentialPhotoError, resolveCredentialPhotoUrl } from '../../../../shared/utils/url.utils';
import {
  getCredentialStatusBadgeClass,
  getCredentialStatusLabel,
} from '../../../../shared/utils/credential-status.utils';
import type { PersonalItem } from '../../models/personal-item.model';

@Component({
  selector: 'app-personal-table-desktop',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  styleUrls: ['./personal-table-desktop.component.scss'],
  template: `
    <div class="pr-table-wrap" style="position: relative;">
      @if (syncing()) {
        <div class="pr-syncing-bar">
          <div class="pr-syncing-progress"></div>
        </div>
      }
      <table class="pr-table">
        <colgroup>
          <col style="width: 5%" />
          <col style="width: 15%" />
          <col style="width: 12%" />
          <col style="width: 17%" />
          <col style="width: 10%" />
          <col style="width: 9%" />
          <col style="width: 24%" />
          <col style="width: 8%" />
        </colgroup>
        <thead>
          <tr>
            <th>Fotografía</th>
            <th>Nombre completo</th>
            <th>Identificación</th>
            <th>Correo institucional</th>
            <th>Estado</th>
            <th class="pr-vigencia-col">Vigencia</th>
            <th class="pr-type-col">Tipo de registro</th>
            <th class="pr-actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            @for (row of [1, 2, 3, 4, 5]; track row) {
              <tr>
                <td>
                  <div class="pr-cell-photo">
                    <div
                      class="pr-photo skeleton"
                      style="width: 36px; height: 36px; border-radius: 50%;"
                    ></div>
                    <div class="pr-name skeleton" style="width: 80px; height: 16px;"></div>
                  </div>
                </td>
                <td>
                  <div
                    class="pr-name skeleton"
                    style="width: 120px; height: 16px; margin-bottom: 6px;"
                  ></div>
                  <div class="pr-sub skeleton" style="width: 60px; height: 12px;"></div>
                </td>
                <td class="pr-id">
                  <span class="skeleton" style="width: 90px; height: 16px;"></span>
                </td>
                <td class="pr-email">
                  <span class="skeleton" style="width: 160px; height: 16px;"></span>
                </td>
                <td>
                  <span
                    class="skeleton"
                    style="display: inline-block; width: 80px; height: 26px; border-radius: 999px;"
                  ></span>
                </td>
                <td class="pr-date pr-vigencia-col">
                  <span class="skeleton" style="width: 80px; height: 16px;"></span>
                </td>
                <td>
                  <span class="skeleton" style="display: inline-block; width: 100px; height: 24px; border-radius: 999px;"></span>
                </td>
                <td class="pr-actions-col">
                  <div class="pr-actions">
                    <div
                      class="skeleton"
                      style="width: 32px; height: 32px; border-radius: 12px; margin-right: 8px;"
                    ></div>
                    <div
                      class="skeleton"
                      style="width: 32px; height: 32px; border-radius: 12px; margin-right: 8px;"
                    ></div>
                    <div
                      class="skeleton"
                      style="width: 32px; height: 32px; border-radius: 12px;"
                    ></div>
                  </div>
                </td>
              </tr>
            }
          } @else {
            @for (row of pagedData(); track row.id) {
              <tr>
                <td>
                  <div class="pr-cell-photo">
                    <div class="pr-photo">
                      <img
                        [src]="resolveCredentialPhotoUrl(row.photoUrl)"
                        [alt]="row.nombreCompleto"
                        (error)="onPhotoError($event)"
                      />
                    </div>
                    <!-- <div class="pr-name">{{ row.nombreCompleto }}</div> -->
                  </div>
                </td>
                <td>
                  <div class="pr-name">{{ row.nombreCompleto }}</div>
                  @if (row.sub) {
                    <div class="pr-sub">{{ row.sub }}</div>
                  }
                </td>
                <td class="pr-id">{{ row.identificacion }}</td>

                <td class="pr-email">{{ row.correo }}</td>
                <td>
                  <span
                    class="pr-badge"
                    [class.ok]="getCredentialStatusBadgeClass(row.estado) === 'ok'"
                    [class.warn]="getCredentialStatusBadgeClass(row.estado) === 'warn'"
                    [class.off]="getCredentialStatusBadgeClass(row.estado) === 'off'"
                    [class.info]="getCredentialStatusBadgeClass(row.estado) === 'info'"
                  >
                    <span class="dot"></span>
                    {{ getCredentialStatusLabel(row.estado) }}
                  </span>
                </td>
                <td class="pr-date pr-vigencia-col">{{ row.validoHasta }}</td>
                <td class="pr-type-col">
                  <span class="pr-type-badge">{{ row.tipoRegistroNombre }}</span>
                </td>
                <td class="pr-actions-col">
                  <div class="pr-actions">
                    <button
                      class="pr-icon-btn"
                      title="Ver"
                      matTooltip="Visualizar credencial"
                      (click)="view.emit(row)"
                      type="button"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button
                      class="pr-icon-btn"
                      title="Editar"
                      matTooltip="Editar registro"
                      (click)="edit.emit(row)"
                      type="button"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    @if (!loading() && filteredDataLength() === 0) {
      <div class="pr-empty">No hay registros para mostrar.</div>
    }

    <!-- Footer -->
    <div class="pr-table-footer">
      <div class="pr-footer-left">
        <div class="pr-hint">{{ paginationHint() }}</div>
        @if (showPageSize()) {
          <label class="pr-page-size">
            <span class="pr-page-size__label">Filas por página</span>
            <select
              class="pr-page-size__select"
              [value]="pageSize()"
              [disabled]="loading() || syncing()"
              (change)="onPageSizeSelect($event)"
            >
              @for (opt of pageSizeOptions(); track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          </label>
        }
      </div>
      <div class="pr-pager">
        <button
          class="pr-page"
          [disabled]="pageIndex() === 0"
          (click)="goToPage(pageIndex() - 1)"
          type="button"
        >
          Anterior
        </button>
        @for (p of pageNumbers(); track $index) {
          @if (p === '...') {
            <span class="pr-page">…</span>
          } @else {
            <button
              class="pr-page"
              [class.active]="pageIndex() === $any(p) - 1"
              (click)="goToPage($any(p) - 1)"
              type="button"
            >
              {{ p }}
            </button>
          }
        }
        <button
          class="pr-page"
          [disabled]="pageIndex() >= totalPages() - 1"
          (click)="goToPage(pageIndex() + 1)"
          type="button"
        >
          Siguiente
        </button>
      </div>
    </div>
  `,
})
export class PersonalTableDesktopComponent {
  loading = input<boolean>(false);
  syncing = input<boolean>(false);
  pagedData = input.required<PersonalItem[]>();
  filteredDataLength = input.required<number>();
  paginationHint = input.required<string>();
  pageIndex = input.required<number>();
  totalPages = input.required<number>();
  pageNumbers = input.required<(number | string)[]>();
  pageSize = input<number>(10);
  pageSizeOptions = input<readonly number[]>([10, 20, 50]);
  showPageSize = input<boolean>(true);

  view = output<PersonalItem>();
  edit = output<PersonalItem>();
  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly resolveCredentialPhotoUrl = resolveCredentialPhotoUrl;
  readonly onPhotoError = onCredentialPhotoError;
  readonly getCredentialStatusLabel = getCredentialStatusLabel;
  readonly getCredentialStatusBadgeClass = getCredentialStatusBadgeClass;

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeSelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(value)) return;
    this.pageSizeChange.emit(value);
  }
}
