import { Component } from '@angular/core';

@Component({
  selector: 'app-layout-topbar-skeleton',
  standalone: true,
  template: `
    <span class="skeleton skeleton-menu-btn" role="status" aria-hidden="true"></span>
    <span class="spacer"></span>
    <span class="skeleton skeleton-avatar" role="status" aria-hidden="true"></span>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .spacer {
      flex: 1 1 auto;
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
    .skeleton-menu-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `,
})
export class LayoutTopbarSkeleton {}
