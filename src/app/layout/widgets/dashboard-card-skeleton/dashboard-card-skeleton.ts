import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-card-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-card" role="status" aria-label="Cargando tarjeta">
      <div class="skeleton-top">
        <span class="skeleton skeleton-icon"></span>
        <span class="skeleton skeleton-title"></span>
      </div>
      <div class="skeleton skeleton-total"></div>
      <div class="skeleton skeleton-subtitle"></div>
      <div class="skeleton skeleton-cta"></div>
    </div>
  `,
  styles: `
    :host { display: block; width: 100%; min-width: 0; height: 100%; }
    .skeleton-card {
      width: 100%;
      min-width: 0;
      margin: 0;
      border: 1px solid #e5e7eb;
      background: #fff;
      border-radius: 16px;
      padding: 1rem;
      height: 100%;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .skeleton-top {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.8rem;
    }
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
    .skeleton-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      flex-shrink: 0;
    }
    .skeleton-title { height: 1rem; width: 60%; }
    .skeleton-total { height: 2rem; width: 40%; margin-bottom: 0.35rem; }
    .skeleton-subtitle { height: 0.9rem; width: 80%; margin-bottom: 0.8rem; }
    .skeleton-cta { height: 0.9rem; width: 30%; }
  `,
})
export class DashboardCardSkeleton {}
