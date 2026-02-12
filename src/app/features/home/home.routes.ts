// features/home/home.routes.ts
import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('../dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'registration',
    loadComponent: () => import('../registration/registration').then((m) => m.Registration),
  },
];
