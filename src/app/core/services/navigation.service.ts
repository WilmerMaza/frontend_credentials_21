import { Injectable, computed } from '@angular/core';
import { INavData } from '../../layout/interfaces/nav-data.interface';
import { MENU } from '../constants/menu.constants';
import { AuthService } from './auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private readonly ItemsInstitution: INavData[] = MENU['instucion'];


  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  readonly navigationItems = computed<INavData[]>(() => {
    // const user = this.authService.getUser();

    // if (!user) {
    //   return [];
    // }

    return this.ItemsInstitution;
  });

  isRouteActive(url: string, currentUrl: string): boolean {
    return currentUrl.includes(url);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  navigateBack(): void {
    window.history.back();
  }
}

export type { INavData };
