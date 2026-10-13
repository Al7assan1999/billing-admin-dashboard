import { Routes } from '@angular/router';

// Each page is lazy-loaded, so the first load only ships the shell and the dashboard.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'Dashboard', loadComponent: () => import('./features/dashboard').then((m) => m.Dashboard) },
  { path: 'invoices', title: 'Invoices', loadComponent: () => import('./features/invoices').then((m) => m.Invoices) },
  { path: 'subscriptions', title: 'Subscriptions', loadComponent: () => import('./features/subscriptions').then((m) => m.Subscriptions) },
  { path: 'customers', title: 'Customers', loadComponent: () => import('./features/customers').then((m) => m.Customers) },
  { path: 'plans', title: 'Plans', loadComponent: () => import('./features/plans').then((m) => m.Plans) },
  { path: '**', redirectTo: 'dashboard' },
];
