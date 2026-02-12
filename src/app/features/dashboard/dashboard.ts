import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonsDashboard } from '../../layout/widgets/buttons-dashboard/buttons-dashboard';
import { DashboardCard } from '../../models/interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonsDashboard],
  template: `
    <div class="welcome-container">
      <div class="welcome-content">
        <h1 class="welcome-title">¡Bienvenido!</h1>
      </div>

      <!-- KPI buttons/cards -->
      <div class="dashboard">
        @for (card of cards; track card.id) {
          <app-buttons-dashboard [button]="card"></app-buttons-dashboard>
        }
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard {
  constructor(
    private route$: ActivatedRoute,
    private router: Router,
  ) {}

  // Totales de ejemplo: reemplaza por tus datos reales (API, signals, store, etc.)
  public cards: DashboardCard[] = [
    {
      id: 1,
      title: 'Pagos',
      total: 12,
      subtitle: 'Procesados hoy',
      route: '/pagos',
      icon: '💳',
      tone: 'blue',
    },
    {
      id: 2,
      title: 'Usuarios',
      total: 248,
      subtitle: 'Activos',
      route: '/usuarios',
      icon: '👤',
      tone: 'green',
    },
    {
      id: 3,
      title: 'Solicitudes',
      total: 31,
      subtitle: 'Pendientes',
      route: '/solicitudes',
      icon: '📝',
      tone: 'orange',
    },
    {
      id: 4,
      title: 'Reportes',
      total: 5,
      subtitle: 'Nuevos',
      route: '/reportes',
      icon: '📊',
      tone: 'purple',
    },
  ];
}
