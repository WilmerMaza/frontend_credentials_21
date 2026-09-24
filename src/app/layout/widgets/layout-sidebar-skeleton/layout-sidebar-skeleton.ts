import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-layout-sidebar-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-skeleton" role="status" aria-label="Cargando menú">
      <div class="skeleton-sidebar-avatar"></div>
      @for (i of navItems; track i) {
        <div class="skeleton-sidebar-item"></div>
      }
      <div class="skeleton-sidebar-logo"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .sidebar-skeleton {
      height: 100vh;
      background: #0a2548;
      display: flex;
      flex-direction: column;
      padding: 1.25rem 0.75rem 0.75rem;
      gap: 0.35rem;
    }
    .skeleton-sidebar-avatar,
    .skeleton-sidebar-item,
    .skeleton-sidebar-logo {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.08) 25%,
        rgba(255, 255, 255, 0.18) 50%,
        rgba(255, 255, 255, 0.08) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-sidebar-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      align-self: center;
      margin-bottom: 0.5rem;
    }
    .skeleton-sidebar-item {
      height: 36px;
      width: 100%;
    }
    .skeleton-sidebar-logo {
      margin-top: auto;
      height: 24px;
      width: 80%;
      align-self: center;
    }
  `,
})
export class LayoutSidebarSkeleton {
  navItems = [1, 2, 3, 4, 5];
}
