import { httpResource } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { BillingApi } from '../core/billing-api';
import { MoneyPipe } from '../core/money.pipe';
import { DashboardSummary } from '../core/models';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-dashboard',
  imports: [MoneyPipe],
  template: `
    <header class="page-header">
      <h1>Dashboard</h1>
      <button (click)="runBilling()">Run billing now</button>
    </header>

    @if (summary.value(); as s) {
      <section class="kpis">
        <div class="kpi">
          <span class="label">Monthly recurring revenue</span>
          <span class="value" data-testid="mrr">{{ s.monthlyRecurringRevenue | money: currency : '1.0-0' }}</span>
        </div>
        <div class="kpi">
          <span class="label">Active subscriptions</span>
          <span class="value" data-testid="active">{{ s.activeSubscriptions }}</span>
        </div>
        <div class="kpi">
          <span class="label">Outstanding</span>
          <span class="value">{{ s.outstanding | money: currency : '1.0-0' }}</span>
        </div>
        <div class="kpi" [class.alert]="s.overdueInvoices > 0">
          <span class="label">Overdue</span>
          <span class="value">{{ s.overdueAmount | money: currency : '1.0-0' }}</span>
          <span class="sub">{{ s.overdueInvoices }} invoice{{ s.overdueInvoices === 1 ? '' : 's' }}</span>
        </div>
      </section>

      <section class="panel">
        <h2>Collected revenue, last 6 months</h2>
        <svg class="chart" viewBox="0 0 600 220" role="img" aria-label="Revenue by month">
          @for (bar of bars(); track bar.month) {
            <g>
              <rect [attr.x]="bar.x" [attr.y]="190 - bar.height" [attr.width]="60" [attr.height]="bar.height" rx="4" />
              <text class="amount" [attr.x]="bar.x + 30" [attr.y]="182 - bar.height">{{ bar.amount | money: currency : '1.0-0' }}</text>
              <text class="month" [attr.x]="bar.x + 30" y="210">{{ bar.month }}</text>
            </g>
          }
        </svg>
      </section>
    } @else if (summary.error()) {
      <p class="muted">Couldn't load the dashboard.</p>
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
})
export class Dashboard {
  private readonly api = inject(BillingApi);
  private readonly toasts = inject(ToastService);

  protected readonly currency = 'SAR';
  protected readonly summary = httpResource<DashboardSummary>(() => BillingApi.urls.dashboard);

  /** Bars scaled to the best month; empty months stay visible as a thin baseline. */
  protected readonly bars = computed(() => {
    const months = this.summary.value()?.revenueLast6Months ?? [];
    const max = Math.max(1, ...months.map((m) => m.amount));
    return months.map((m, i) => ({ ...m, x: 20 + i * 97, height: Math.max(2, (m.amount / max) * 150) }));
  });

  protected runBilling() {
    this.api.runBilling().subscribe((r) => {
      this.toasts.success(`Billing run issued ${r.invoicesIssued} invoice(s).`);
      this.summary.reload();
    });
  }
}
