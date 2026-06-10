// features/home/home.routes.ts
import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('../dashboard/dashboard').then((m) => m.Dashboard),
  },
  // Personal registrado (lista y formulario de registro como rutas hijas)
  {
    path: 'personal-registrado',
    loadComponent: () =>
      import('../personal-registrado/personal-registrado-shell').then(
        (m) => m.PersonalRegistradoShell,
      ),
    data: { breadcrumb: 'Personal Registrado' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../personal-registrado/personal-registrado').then((m) => m.PersonalRegistrado),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('../registration/registration').then((m) => m.Registration),
        data: { breadcrumb: 'Registro de Personal' },
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('../credential-edit/credential-edit').then((m) => m.CredentialEdit),
        data: { breadcrumb: 'Editar credencial' },
      },
      // Visualización de credencial (escarapela)
      {
        path: 'credential/:id',
        loadComponent: () =>
          import('../credential-view/credential-view').then((m) => m.CredentialView),
      },
    ],
  },
  // Redirect legacy /registration para no romper enlaces antiguos
  {
    path: 'registration',
    redirectTo: 'personal-registrado/registro',
    pathMatch: 'full',
  },
 
];
