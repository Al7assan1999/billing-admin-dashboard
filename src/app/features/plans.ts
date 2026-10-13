import { httpResource } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingApi } from '../core/billing-api';
import { MoneyPipe } from '../core/money.pipe';
import { Plan } from '../core/models';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-plans',
  imports: [MoneyPipe, ReactiveFormsModule],
  template: `
    <header class="page-header"><h1>Plans</h1></header>

    <form class="panel inline-form" [formGroup]="form" (ngSubmit)="create()">
      <label>Name <input formControlName="name" placeholder="Pro" /></label>
      <label>Monthly price <input formControlName="monthlyPrice" type="number" min="0.01" step="0.01" /></label>
      <label>Currency <input formControlName="currency" maxlength="3" class="short" /></label>
      <button type="submit" [disabled]="form.invalid">Add plan</button>
    </form>

    <table class="panel">
      <thead><tr><th>Plan</th><th class="num">Monthly price</th><th>Status</th><th></th></tr></thead>
      <tbody>
        @for (p of plans.value() ?? []; track p.id) {
          <tr>
            <td>{{ p.name }}</td>
            <td class="num">{{ p.monthlyPrice | money: p.currency }}</td>
            <td><span class="badge" [class.muted]="!p.isActive">{{ p.isActive ? 'Active' : 'Retired' }}</span></td>
            <td class="actions">
              @if (p.isActive) {
                <button class="ghost" (click)="retire(p)">Retire</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="muted">No plans yet.</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class Plans {
  private readonly api = inject(BillingApi);
  private readonly toasts = inject(ToastService);

  protected readonly plans = httpResource<Plan[]>(() => BillingApi.urls.plans);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    monthlyPrice: [99, [Validators.required, Validators.min(0.01)]],
    currency: ['SAR', [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]],
  });

  protected create() {
    this.api.createPlan(this.form.getRawValue()).subscribe((p) => {
      this.toasts.success(`Plan ${p.name} created.`);
      this.form.reset();
      this.plans.reload();
    });
  }

  protected retire(plan: Plan) {
    if (!confirm(`Retire ${plan.name}? Existing subscribers keep it; nobody new can subscribe.`)) return;
    this.api.retirePlan(plan.id).subscribe(() => {
      this.toasts.success(`${plan.name} retired.`);
      this.plans.reload();
    });
  }
}
