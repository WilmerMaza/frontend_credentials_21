import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface StatCard {
  label: string;
  total: number;
  icon: string;
}

@Component({
  selector: 'app-personal-metrics',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  styleUrls: ['./personal-metrics.component.scss'],
  template: `
    @if (isMobile()) {
      <!-- Métricas móvil (scroll horizontal) -->
      <section class="m-metrics">
        @for (card of statCards(); track card.label) {
          <div class="metric">
            <div class="metric-ico" [class.ok]="card.icon === 'check'" [class.off]="card.icon === 'close'" [class.warn]="card.icon === 'chat_bubble' || card.icon === 'schedule'">
              <mat-icon>{{ card.icon }}</mat-icon>
            </div>
            <div>
              <div class="metric-val">{{ card.total }}</div>
              <div class="metric-lab">{{ card.label }}</div>
            </div>
          </div>
        }
      </section>
    } @else {
      <!-- Métricas desktop -->
      <div class="pr-metric-card">
        <div class="pr-metrics">
          @for (card of statCards(); track card.label) {
            <div class="pr-metric">
              <div class="pr-metric__ico">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div>
                <div class="pr-metric__val">{{ card.total }}</div>
                <div class="pr-metric__lab">{{ card.label }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class PersonalMetricsComponent {
  statCards = input.required<StatCard[]>();
  isMobile = input<boolean>(false);
}
