import { CommonModule } from '@angular/common';
import { Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutLoadingService } from '../../core/services/layout-loading.service';
import { ButtonsDashboard } from '../../layout/widgets/buttons-dashboard/buttons-dashboard';
import { DashboardContentSkeleton } from '../../layout/widgets/dashboard-content-skeleton/dashboard-content-skeleton';
import { DashboardCard } from '../../models/interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonsDashboard, DashboardContentSkeleton],
  template: `
    @if (loading()) {
      <app-dashboard-content-skeleton />
    } @else {
      <div class="welcome-container">
        <div class="hero-section">
          <div class="hero-bg-pattern"></div>
          <div class="hero-shape hero-shape-1"></div>
          <div class="hero-shape hero-shape-2"></div>
          <div class="hero-wave" aria-hidden="true"></div>
          <div class="hero-content">
            <span class="hero-badge">Panel ENAP</span>
            <h1
              class="welcome-title"
              [class.chrome-active]="chromeActive()"
              (click)="triggerChrome()"
              role="button"
              tabindex="0"
              aria-label="¡Bienvenido! Presiona para ver efecto cromado"
              (keydown.enter)="triggerChrome()"
              (keydown.space)="triggerChrome(); $event.preventDefault()"
            >
              ¡Bienvenido!
            </h1>
            <p class="welcome-subtitle">Registro de personal y gestión de usuarios de la Escuela Naval</p>
            <div class="hero-decoration"></div>
          </div>
        </div>

        <h2 class="section-title">Accesos rápidos</h2>
        <div class="dashboard">
          @for (card of cards; track card.id) {
            <app-buttons-dashboard [button]="card"></app-buttons-dashboard>
          }
        </div>
      </div>
    }
  `,
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard {
  loading = signal(true);
  chromeActive = signal(false);
  private layoutLoading = inject(LayoutLoadingService);

  triggerChrome(): void {
    this.chromeActive.set(true);
    setTimeout(() => this.chromeActive.set(false), 2500);
  }

  constructor(
    private route$: ActivatedRoute,
    private router: Router,
  ) {
    this.layoutLoading.setLoading(true);
    afterNextRender(() => {
      setTimeout(() => {
        this.loading.set(false);
        this.layoutLoading.setLoading(false);
      }, 700);
    });
  }

  public cards: DashboardCard[] = [
    {
      id: 1,
      title: 'Registro',
      description: 'Registrar nuevo personal militar o civil en el sistema',
      route: '/personal-registrado/registro',
      icon: '📝',
      iconName: 'person_add',
      tone: 'blue',
    },
    {
      id: 2,
      title: 'Gestión de Usuario',
      description: 'Administrar y consultar el personal registrado',
      route: '/personal-registrado',
      icon: '👥',
      iconName: 'manage_accounts',
      tone: 'green',
    },
  ];
}
