import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardCardSkeleton } from '../dashboard-card-skeleton/dashboard-card-skeleton';

@Component({
  selector: 'app-dashboard-content-skeleton',
  standalone: true,
  imports: [CommonModule, DashboardCardSkeleton],
  template: `
    <div class="welcome-container" role="status" aria-label="Cargando dashboard">
      <div class="welcome-content">
        <div class="skeleton skeleton-title"></div>
      </div>
      <div class="dashboard">
        @for (i of [1, 2, 3, 4]; track i) {
          <app-dashboard-card-skeleton />
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .welcome-container {
      padding: 2rem;
      background-color: #f9fafb;
    }
    .welcome-content {
      text-align: center;
      max-width: 800px;
      width: 100%;
      margin: 0 auto 1.5rem auto;
      height: 10vh;
    }
    .skeleton-title {
      height: 3rem;
      width: 40%;
      margin: 0 auto 1rem;
    }
    .dashboard {
      max-width: 1200px;
      margin: 1rem auto 2rem auto;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-auto-rows: 160px;
      gap: 1rem;
      align-items: stretch;
    }
    @media (max-width: 1100px) {
      .dashboard {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .welcome-container {
        padding: 1rem;
      }
      .dashboard {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DashboardContentSkeleton {}
