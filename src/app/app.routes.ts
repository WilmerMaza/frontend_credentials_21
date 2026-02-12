import { Routes } from '@angular/router';
import { Page404} from './pages/page404/page404';
import { Page500Component } from './pages/page500/page500.component';
import { Layout } from './layout/home/layout';

export const routes: Routes = [
  // Auth pública
  {
    path: 'login',
    // canActivate: [JwtGuard],
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    // canActivate: [JwtGuard],
    children: [
      {
        path: '',
        component: Layout,
        data: { title: 'Home', showMenuToggle: true },
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
    ],
  },

  // Status
  { path: '404', component: Page404, data: { title: 'Page 404' } },
  { path: '500', component: Page500Component, data: { title: 'Page 500' } },

  // Catch-all: llevar a 404
  { path: '**', redirectTo: '404' },
];
