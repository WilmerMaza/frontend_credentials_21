import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getPhotoUrl } from '../../../../shared/utils/url.utils';
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
          <col style="width: 16%" />
          <col style="width: 12%" />
          <col style="width: 21%" />
          <col style="width: 10%" />
          <col style="width: 10%" />
          <col style="width: 12%" />
          <col style="width: 14%" />
        </colgroup>
        <thead>
          <tr>
            <th>Fotografía</th>
            <th>Nombre completo</th>
            <th>Identificación</th>
            <th>Correo institucional</th>
            <th>Fecha ingreso</th>
            <th>Estado</th>
            <th>Tipo de registro</th>
            <th>Acciones</th>
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
                <td class="pr-date">
                  <span class="skeleton" style="width: 80px; height: 16px;"></span>
                </td>
                <td>
                  <span
                    class="skeleton"
                    style="display: inline-block; width: 80px; height: 26px; border-radius: 999px;"
                  ></span>
                </td>
                <td>
                  <span class="skeleton" style="display: inline-block; width: 100px; height: 24px; border-radius: 999px;"></span>
                </td>
                <td>
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
                      @if (row.photoUrl) {
                        <img [src]="getPhotoUrl(row.photoUrl)" [alt]="row.nombreCompleto" />
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
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
                <td class="pr-date">{{ row.fechaIngreso }}</td>
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
                <td>
                  <span class="pr-type-badge">{{ row.tipoRegistroNombre }}</span>
                </td>
                <td>
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
                    <button
                      class="pr-icon-btn"
                      title="Eliminar"
                      matTooltip="Eliminar registro"
                      (click)="delete.emit(row)"
                      type="button"
                    >
                      <mat-icon>delete</mat-icon>
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
      <div class="pr-hint">{{ paginationHint() }}</div>
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

  view = output<PersonalItem>();
  edit = output<PersonalItem>();
  delete = output<PersonalItem>();
  pageChange = output<number>();

  readonly getPhotoUrl = getPhotoUrl;
  readonly getCredentialStatusLabel = getCredentialStatusLabel;
  readonly getCredentialStatusBadgeClass = getCredentialStatusBadgeClass;

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
