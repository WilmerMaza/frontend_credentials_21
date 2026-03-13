import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { DashboardCard } from '../../../models/interface';

@Component({
  selector: 'app-buttons-dashboard',
  imports: [MatIconModule],
  standalone: true,
  templateUrl: './buttons-dashboard.html',
  styleUrl: './buttons-dashboard.scss',
})
export class ButtonsDashboard {
  readonly button = input.required<DashboardCard>();

  constructor(private router: Router) {}

  public goTo(route: string): void {
    // navegación por click
    this.router.navigateByUrl(route);
  }
}
