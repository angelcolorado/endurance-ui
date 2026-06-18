import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/events/pages/event-list/event-list.component').then(
            (m) => m.EventListComponent
          ),
      },
      {
        path: 'events/new',
        loadComponent: () =>
          import('./features/events/pages/event-create/event-create.component').then(
            (m) => m.EventCreateComponent
          ),
      },
      {
        path: 'logistics',
        loadComponent: () =>
          import('./features/logistics/pages/logistics-event-list/logistics-event-list.component').then(
            (m) => m.LogisticsEventListComponent
          ),
      },
      {
        path: 'logistics/:eventId',
        loadComponent: () =>
          import('./features/logistics/pages/event-logistics/event-logistics.component').then(
            (m) => m.EventLogisticsComponent
          ),
      },
    ],
  },
];
