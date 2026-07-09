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
  selector: 'app-personal-list-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  styleUrls: ['./personal-list-mobile.component.scss'],
  template: `
    <section class="list-card">
      <div class="list-head">
        <div class="list-title">Registros</div>
        <div class="list-head__meta">
          <div class="list-hint">
            @if (syncing()) {
              <span class="m-syncing-text" style="color: var(--pr-navy); font-weight: bold; animation: pulse 1.5s infinite;">Actualizando...</span>
            } @else {
              {{ paginationHint() }}
            }
          </div>
          @if (showPageSize()) {
            <label class="m-page-size">
              <span class="m-page-size__label">Filas</span>
              <select
                class="m-page-size__select"
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
      </div>

      @if (loading()) {
        @for (i of [1, 2, 3]; track i) {
          <article class="row-card">
            <div class="row-top">
              <div class="row-left">
                <div class="photo skeleton" style="width: 44px; height: 44px; border-radius: 50%;"></div>
                <div>
                  <div class="name skeleton" style="width: 140px; height: 16px;"></div>
                  <div class="meta skeleton" style="width: 90px; height: 12px; margin-top: 6px;"></div>
                </div>
              </div>
              <span class="badge skeleton" style="width: 70px; height: 26px; border-radius: 999px;"></span>
            </div>
            <div class="row-grid">
              <div class="kv">
                <div class="k">Rango</div>
                <div class="v skeleton" style="width: 80px; height: 16px; margin-top: 4px;"></div>
              </div>
              <div class="kv">
                <div class="k">Vigencia</div>
                <div class="v skeleton" style="width: 70px; height: 16px; margin-top: 4px;"></div>
              </div>
              <div class="kv full">
                <div class="k">Correo</div>
                <div class="v skeleton" style="width: 180px; height: 16px; margin-top: 4px;"></div>
              </div>
            </div>
            <div class="actions">
              <div class="a-btn skeleton" style="height: 44px; border-radius: 14px; flex: 1;"></div>
              <div class="a-btn skeleton" style="height: 44px; border-radius: 14px; flex: 1;"></div>
              <div class="a-btn skeleton" style="height: 44px; border-radius: 14px; flex: 1;"></div>
            </div>
          </article>
        }
      } @else {
        @for (row of pagedData(); track row.id) {
          <article class="row-card">
            <div class="row-top">
              <div class="row-left">
                <div class="photo">
                  <img
                    [src]="resolveCredentialPhotoUrl(row.photoUrl)"
                    [alt]="row.nombreCompleto"
                    (error)="onPhotoError($event)"
                  />
                </div>
                <div>
                  <div class="name">{{ row.nombreCompleto }}</div>
                  <div class="meta">{{ row.identificacion }}</div>
                  <div class="type-chip">{{ row.tipoRegistroNombre }}</div>
                </div>
              </div>
              <span
                class="badge"
                [class.ok]="getCredentialStatusBadgeClass(row.estado) === 'ok'"
                [class.warn]="getCredentialStatusBadgeClass(row.estado) === 'warn'"
                [class.off]="getCredentialStatusBadgeClass(row.estado) === 'off'"
                [class.info]="getCredentialStatusBadgeClass(row.estado) === 'info'"
              >
                <span class="dot"></span>
                {{ getCredentialStatusLabel(row.estado) }}
              </span>
            </div>
            <div class="row-grid">
              <div class="kv">
                <div class="k">Rango</div>
                <div class="v">{{ row.rango }}</div>
              </div>
              <div class="kv">
                <div class="k">Vigencia</div>
                <div class="v">{{ row.validoHasta }}</div>
              </div>
              <div class="kv full">
                <div class="k">Correo</div>
                <div class="v">{{ row.correo }}</div>
              </div>
            </div>
            <div class="actions">
              <button class="a-btn" title="Ver" matTooltip="Visualizar credencial" (click)="view.emit(row)" type="button">
                <mat-icon>visibility</mat-icon>
              </button>
              <button class="a-btn" title="Editar" matTooltip="Editar registro" (click)="edit.emit(row)" type="button">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </article>
        }

        @if (!loading() && filteredDataLength() === 0) {
          <div class="m-empty">No hay registros para mostrar.</div>
        }
      }

      <!-- Paginación móvil -->
      <div class="pager">
        <button class="p-btn" [disabled]="pageIndex() === 0" (click)="goToPage(pageIndex() - 1)" type="button">
          Anterior
        </button>
        <div class="p-mid">
          @for (p of pageNumbers(); track $index) {
            @if (p === '...') {
              <span class="p-etc">…</span>
            } @else {
              <button
                class="p-num"
                [class.active]="pageIndex() === $any(p) - 1"
                (click)="goToPage($any(p) - 1)"
                type="button"
              >
                {{ p }}
              </button>
            }
          }
        </div>
        <button class="p-btn" [disabled]="pageIndex() >= totalPages() - 1" (click)="goToPage(pageIndex() + 1)" type="button">
          Siguiente
        </button>
      </div>
    </section>
  `
})
export class PersonalListMobileComponent {
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
