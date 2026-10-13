import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingApi } from '../core/billing-api';
import { Customer } from '../core/models';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <header class="page-header"><h1>Customers</h1></header>

    <form class="panel inline-form" [formGroup]="form" (ngSubmit)="create()">
      <label>
        Name
        <input formControlName="name" placeholder="Acme Ltd" />
      </label>
      <label>
        Email
        <input formControlName="email" type="email" placeholder="billing@acme.com" />
      </label>
      <button type="submit" [disabled]="form.invalid || saving">Add customer</button>
      @if (form.controls.email.touched && form.controls.email.invalid) {
        <span class="field-error">Enter a valid email.</span>
      }
    </form>

    <table class="panel">
      <thead><tr><th>Name</th><th>Email</th><th>Since</th></tr></thead>
      <tbody>
        @for (c of customers.value() ?? []; track c.id) {
          <tr><td>{{ c.name }}</td><td>{{ c.email }}</td><td>{{ c.createdAt | date: 'mediumDate' }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="muted">No customers yet.</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class Customers {
  private readonly api = inject(BillingApi);
  private readonly toasts = inject(ToastService);

  protected readonly customers = httpResource<Customer[]>(() => BillingApi.urls.customers);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
  });
  protected saving = false;

  protected create() {
    this.saving = true;
    this.api.createCustomer(this.form.getRawValue()).subscribe({
      next: (c) => {
        this.toasts.success(`Added ${c.name}.`);
        this.form.reset();
        this.customers.reload();
      },
      complete: () => (this.saving = false),
      error: () => (this.saving = false),
    });
  }
}
