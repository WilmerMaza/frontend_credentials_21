// features/home/home.routes.ts
import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('../dashboard/dashboard').then((m) => m.Dashboard),
  },
  // Personal registrado (lista) - paso previo al formulario
  {
    path: 'personal-registrado',
    loadComponent: () =>
      import('../personal-registrado/personal-registrado').then((m) => m.PersonalRegistrado),
  },
  // Formulario de registro
  {
    path: 'registration',
    loadComponent: () => import('../registration/registration').then((m) => m.Registration),
  },
  // Visualización de credencial (escarapela)
  {
    path: 'credential/:id',
    loadComponent: () =>
      import('../credential-view/credential-view').then((m) => m.CredentialView),
  },
];
