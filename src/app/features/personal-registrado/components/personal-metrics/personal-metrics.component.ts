import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface StatCard {
  label: string;
  total: number;
  tone?: 'primary' | 'success' | 'warning' | 'muted' | 'neutral';
}

@Component({
  selector: 'app-personal-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  styleUrls: ['./personal-metrics.component.scss'],
  template: `
    <section class="metrics" [class.metrics--mobile]="isMobile()" aria-label="Resumen">
      @for (card of statCards(); track card.label) {
        <div class="metric" [attr.data-tone]="card.tone || 'neutral'">
          @if (card.tone === 'primary') {
            <mat-icon class="metric__icon" aria-hidden="true">group</mat-icon>
          } @else {
            <span class="metric__dot" aria-hidden="true"></span>
          }
          <div class="metric__copy">
            <div class="metric__value">{{ card.total }}</div>
            <div class="metric__label">{{ card.label }}</div>
          </div>
        </div>
      }

      <div class="metric metric--action">
        <button
          mat-stroked-button
          type="button"
          class="metrics-filter-btn"
          [class.metrics-filter-btn--open]="filtersExpanded()"
          [class.metrics-filter-btn--active]="filtersActive()"
          (click)="toggleFilters()"
          [attr.aria-expanded]="filtersExpanded()"
          aria-controls="personal-filters-panel"
          [matTooltip]="filtersExpanded() ? 'Ocultar filtros' : 'Mostrar filtros'"
        >
          <mat-icon>filter_list</mat-icon>
          <span class="metrics-filter-btn__label">Filtros</span>
        </button>
      </div>
    </section>
  `,
})
export class PersonalMetricsComponent {
  statCards = input.required<StatCard[]>();
  isMobile = input<boolean>(false);
  filtersExpanded = model<boolean>(false);
  filtersActive = input<boolean>(false);

  toggleFilters(): void {
    this.filtersExpanded.update((v) => !v);
  }
}
