import { Component, input } from '@angular/core';
import { DashboardCard } from '../../../models/interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buttons-dashboard',
  imports: [],
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
