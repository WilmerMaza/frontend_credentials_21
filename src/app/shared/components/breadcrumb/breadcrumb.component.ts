import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter, startWith } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        @for (item of breadcrumbs(); track item.label; let last = $last) {
          @if (!$first) {
            <li class="breadcrumb-separator" aria-hidden="true">
              <mat-icon class="sep-icon">chevron_right</mat-icon>
            </li>
          }
          
          <li class="breadcrumb-item" [class.active]="last">
            @if (last) {
              <span class="breadcrumb-current">
                @if (item.label === 'Home' || item.label === 'Inicio') {
                  <mat-icon class="item-icon-inline">home</mat-icon>
                }
                {{ item.label }}
              </span>
            } @else {
              <a [routerLink]="item.url || '/dashboard'" class="breadcrumb-link">
                @if (item.label === 'Home' || item.label === 'Inicio') {
                  <mat-icon class="item-icon-inline">home</mat-icon>
                } @else if (item.icon) {
                  <mat-icon class="item-icon">{{ item.icon }}</mat-icon>
                }
                <span class="link-text">{{ item.label }}</span>
              </a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-nav {
      display: flex;
      align-items: center;
      padding: 0;
      margin-bottom: 8px;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      overflow-x: auto;
      scrollbar-width: none; /* Firefox */
      
      &::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
      }
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      list-style: none;
      padding: 0;
      margin: 0;
      white-space: nowrap;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 400;
      color: #64748b;
      min-width: 0;
      
      &.active {
        font-weight: 500;
        color: #0a2850;
      }
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      color: #64748b;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 6px;
      padding: 4px 6px;
      margin: 0 -4px;

      &:hover {
        color: #0a2850;
        background-color: rgba(10, 40, 80, 0.06);
      }

      &:active {
        transform: scale(0.96);
      }
    }

    .item-icon-inline {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: text-bottom;
    }

    .item-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .breadcrumb-separator {
      display: flex;
      align-items: center;
      margin: 0 4px;
      color: #94a3b8;
      user-select: none;
    }

    .sep-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .breadcrumb-current {
      color: #0f172a;
      font-weight: 600;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 4px 0;
    }

    .link-text {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      .breadcrumb-item {
        font-size: 12.5px;
      }
      .breadcrumb-current, .link-text {
        max-width: 120px;
      }
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  @Input() items?: BreadcrumbItem[];

  breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    if (this.items) {
      this.breadcrumbs.set(this.items);
      return;
    }

    // Escuchar cambios de ruta para autogenerar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null)
    ).subscribe(() => {
      const generated = this.createBreadcrumbs(this.activatedRoute.root);
      this.breadcrumbs.set(generated);
    });
  }

  private createBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      let nextUrl = url;
      if (routeURL !== '') {
        nextUrl += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'] || child.snapshot.data['title'];
      const icon = child.snapshot.data['breadcrumbIcon'];
      
      if (label) {
        const isDuplicate = breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].label === label;
        if (!isDuplicate) {
          breadcrumbs.push({ label, url: nextUrl, icon });
        }
      }

      return this.createBreadcrumbs(child, nextUrl, breadcrumbs);
    }

    return breadcrumbs;
  }
}
