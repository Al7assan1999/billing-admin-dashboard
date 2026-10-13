import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastHost } from './core/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/invoices', label: 'Invoices' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/customers', label: 'Customers' },
    { path: '/plans', label: 'Plans' },
  ];
}
