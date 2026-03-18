import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardCardSkeleton } from '../dashboard-card-skeleton/dashboard-card-skeleton';

@Component({
  selector: 'app-dashboard-content-skeleton',
  standalone: true,
  imports: [CommonModule, DashboardCardSkeleton],
  template: `
    <div class="welcome-container" role="status" aria-label="Cargando dashboard">
      <div class="hero-section">
        <div class="hero-content">
          <div class="skeleton skeleton-badge"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-subtitle"></div>
          <div class="skeleton skeleton-decoration"></div>
        </div>
      </div>
      <div class="skeleton skeleton-section-title"></div>
      <div class="dashboard">
        @for (i of [1, 2]; track i) {
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
      min-height: 100%;
      background: linear-gradient(180deg, #ffffff 0%, #f4f6f9 25%, #f4f6f9 100%);
    }
    .hero-section {
      position: relative;
      text-align: center;
      max-width: 900px;
      width: 100%;
      margin: 0 auto 3rem auto;
      padding: 3rem 1.5rem;
      border-radius: 24px;
    }
    .hero-content {
      position: relative;
      z-index: 1;
    }
    .skeleton-badge {
      height: 1.5rem;
      width: 100px;
      margin: 0 auto 1rem;
      border-radius: 100px;
    }
    .skeleton-title {
      height: 3.5rem;
      width: 45%;
      margin: 0 auto 0.75rem;
    }
    .skeleton-subtitle {
      height: 1.2rem;
      width: 60%;
      margin: 0 auto 1.5rem;
    }
    .skeleton-decoration {
      width: 80px;
      height: 5px;
      margin: 0 auto;
      border-radius: 3px;
    }
    .skeleton-section-title {
      height: 1.25rem;
      width: 140px;
      margin: 0 auto 1.25rem auto;
      border-radius: 4px;
    }
    .dashboard {
      max-width: 1100px;
      margin: 0 auto 2rem auto;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 200px;
      gap: 1.5rem;
      align-items: stretch;
    }
    @media (max-width: 900px) {
      .dashboard {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .welcome-container {
        padding: 1rem;
      }
      .hero-section {
        padding: 2rem 1rem;
        margin-bottom: 2rem;
      }
      .dashboard {
        grid-template-columns: 1fr;
        grid-auto-rows: 180px;
        gap: 1rem;
      }
    }
  `,
})
export class DashboardContentSkeleton {}
