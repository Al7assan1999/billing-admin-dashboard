import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingApi } from '../core/billing-api';
import { MoneyPipe } from '../core/money.pipe';
import { Customer, Plan, Subscription } from '../core/models';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-subscriptions',
  imports: [MoneyPipe, ReactiveFormsModule, DatePipe],
  template: `
    <header class="page-header"><h1>Subscriptions</h1></header>

    <form class="panel inline-form" [formGroup]="form" (ngSubmit)="start()">
      <label>
        Customer
        <select formControlName="customerId" aria-label="Customer">
          <option value="" disabled>Choose…</option>
          @for (c of customers.value() ?? []; track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </label>
      <label>
        Plan
        <select formControlName="planId" aria-label="Plan">
          <option value="" disabled>Choose…</option>
          @for (p of activePlans(); track p.id) {
            <option [value]="p.id">{{ p.name }} · {{ p.monthlyPrice | money: p.currency }}/mo</option>
          }
        </select>
      </label>
      <button type="submit" [disabled]="form.invalid">Start subscription</button>
    </form>

    <table class="panel">
      <thead>
        <tr><th>Customer</th><th>Plan</th><th>Status</th><th>Current period</th><th>Change plan</th><th></th></tr>
      </thead>
      <tbody>
        @for (s of subscriptions.value() ?? []; track s.id) {
          <tr>
            <td>{{ s.customerName }}</td>
            <td>{{ s.planName }}</td>
            <td><span class="badge" [class.muted]="s.status === 'Cancelled'">{{ s.status }}</span></td>
            <td>{{ s.currentPeriodStart | date: 'mediumDate' }} – {{ s.currentPeriodEnd | date: 'mediumDate' }}</td>
            <td>
              @if (s.status === 'Active') {
                <select #next (change)="changePlan(s, next.value); next.value = ''" [attr.aria-label]="'Change plan for ' + s.customerName">
                  <option value="">Switch to…</option>
                  @for (p of activePlans(); track p.id) {
                    @if (p.id !== s.planId) {
                      <option [value]="p.id">{{ p.name }}</option>
                    }
                  }
                </select>
              }
            </td>
            <td class="actions">
              @if (s.status === 'Active') {
                <button class="ghost" (click)="cancel(s)">Cancel</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="6" class="muted">No subscriptions yet.</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class Subscriptions {
  private readonly api = inject(BillingApi);
  private readonly toasts = inject(ToastService);

  protected readonly subscriptions = httpResource<Subscription[]>(() => BillingApi.urls.subscriptions);
  protected readonly customers = httpResource<Customer[]>(() => BillingApi.urls.customers);
  protected readonly plans = httpResource<Plan[]>(() => BillingApi.urls.plans);
  protected readonly activePlans = computed(() => (this.plans.value() ?? []).filter((p) => p.isActive));

  protected readonly form = inject(FormBuilder).nonNullable.group({
    customerId: ['', Validators.required],
    planId: ['', Validators.required],
  });

  protected start() {
    this.api.startSubscription(this.form.getRawValue()).subscribe(({ invoice }) => {
      this.toasts.success(`Subscription started. Invoice ${invoice.number} issued for ${invoice.total} ${invoice.currency}.`);
      this.form.reset();
      this.subscriptions.reload();
    });
  }

  protected changePlan(s: Subscription, planId: string) {
    if (!planId) return;
    this.api.changePlan(s.id, planId).subscribe((invoice) => {
      this.toasts.success(`Plan changed. Prorated invoice ${invoice.number}: ${invoice.total} ${invoice.currency}.`);
      this.subscriptions.reload();
    });
  }

  protected cancel(s: Subscription) {
    if (!confirm(`Cancel ${s.customerName}'s ${s.planName} subscription? It won't renew.`)) return;
    this.api.cancelSubscription(s.id).subscribe(() => {
      this.toasts.success('Subscription cancelled.');
      this.subscriptions.reload();
    });
  }
}
