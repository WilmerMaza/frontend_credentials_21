import { Component, effect, input, output, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';

import { Router } from '@angular/router';
import { INavData, NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MatSidenavModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {
  readonly collapsed = input.required<boolean>();
  readonly showText: WritableSignal<boolean> = signal(true);
  readonly closeSidebar = output<void>();

  private textTimeout?: number;
  avatar: string = '/images/avatars/default-profile.png';
  username: string = 'ENAP';

  constructor(
    private navigationService: NavigationService,
    private router: Router,
  ) {
    effect(() => {
      const isCollapsed = this.collapsed();

      if (isCollapsed) {
        this.showText.set(false);
        if (this.textTimeout) clearTimeout(this.textTimeout);
      } else {
        if (this.textTimeout) clearTimeout(this.textTimeout);
        this.textTimeout = window.setTimeout(() => {
          this.showText.set(true);
        }, 120);
      }
    });
  }

  get Menu(): INavData[] {
    return this.navigationService.navigationItems();
  }

  isActive(url: string): boolean {
    return this.navigationService.isRouteActive(url, this.router.url);
  }

  navigateTo(url: string): void {
    this.router.navigate([url]);
    this.closeSidebar.emit();
  }
}
