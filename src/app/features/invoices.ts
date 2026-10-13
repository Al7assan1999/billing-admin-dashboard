import { DatePipe, PercentPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BillingApi } from '../core/billing-api';
import { MoneyPipe } from '../core/money.pipe';
import { Invoice, InvoiceFilter, InvoiceStatus, PagedResult } from '../core/models';
import { ToastService } from '../core/toast';

@Component({
  selector: 'app-invoices',
  imports: [MoneyPipe, FormsModule, DatePipe, PercentPipe],
  template: `
    <header class="page-header"><h1>Invoices</h1></header>

    <div class="panel inline-form">
      <label>
        Status
        <select [ngModel]="filter().status" (ngModelChange)="setFilter({ status: $event })" aria-label="Filter by status">
          <option value="">All</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </label>
      <label class="check">
        <input type="checkbox" [ngModel]="filter().overdue" (ngModelChange)="setFilter({ overdue: $event })" />
        Overdue only
      </label>
    </div>

    <table class="panel">
      <thead>
        <tr><th>Number</th><th>Customer</th><th>Issued</th><th>Due</th><th>Status</th><th class="num">Total</th><th class="num">Due now</th></tr>
      </thead>
      <tbody>
        @for (i of page.value()?.items ?? []; track i.id) {
          <tr class="clickable" (click)="selected.set(i)" [class.selected]="selected()?.id === i.id">
            <td>{{ i.number }}</td>
            <td>{{ i.customerName }}</td>
            <td>{{ i.issuedOn | date: 'mediumDate' }}</td>
            <td>{{ i.dueOn | date: 'mediumDate' }}</td>
            <td>
              <span class="badge" [class.alert]="i.isOverdue" [class.ok]="i.status === 'Paid'">{{ i.isOverdue ? 'Overdue' : i.status }}</span>
            </td>
            <td class="num">{{ i.total | money: i.currency }}</td>
            <td class="num">{{ i.amountDue | money: i.currency }}</td>
          </tr>
        } @empty {
          <tr><td colspan="7" class="muted">No invoices match.</td></tr>
        }
      </tbody>
    </table>

    @if (page.value(); as p) {
      <nav class="pager" aria-label="Pagination">
        <button class="ghost" [disabled]="p.page <= 1" (click)="setFilter({ page: p.page - 1 })">Previous</button>
        <span>Page {{ p.page }} of {{ pageCount() }} · {{ p.totalCount }} invoices</span>
        <button class="ghost" [disabled]="p.page >= pageCount()" (click)="setFilter({ page: p.page + 1 })">Next</button>
      </nav>
    }

    @if (selected(); as i) {
      <aside class="drawer panel" aria-label="Invoice details">
        <header class="page-header">
          <h2>{{ i.number }}</h2>
          <button class="ghost" (click)="selected.set(null)" aria-label="Close">✕</button>
        </header>
        <p>{{ i.customerName }} · {{ i.periodStart | date: 'mediumDate' }} – {{ i.periodEnd | date: 'mediumDate' }}</p>
        <table>
          @for (l of i.lines; track $index) {
            <tr><td>{{ l.description }}</td><td class="num">{{ l.amount | money: i.currency }}</td></tr>
          }
          <tr><td>Subtotal</td><td class="num">{{ i.subtotal | money: i.currency }}</td></tr>
          <tr><td>VAT {{ i.taxRate | percent }}</td><td class="num">{{ i.tax | money: i.currency }}</td></tr>
          <tr class="total"><td>Total</td><td class="num">{{ i.total | money: i.currency }}</td></tr>
        </table>

        <div class="drawer-actions">
          <a class="button ghost" [href]="pdfUrl(i)" target="_blank" rel="noopener">Download PDF</a>
          @if (i.status === 'Issued') {
            <form class="inline-form" (ngSubmit)="pay(i)">
              <input type="number" name="amount" [(ngModel)]="paymentAmount" [max]="i.amountDue" min="0.01" step="0.01" aria-label="Payment amount" />
              <button type="submit">Record payment</button>
            </form>
          }
        </div>
      </aside>
    }
  `,
})
export class Invoices {
  private readonly api = inject(BillingApi);
  private readonly toasts = inject(ToastService);

  protected readonly statuses: InvoiceStatus[] = ['Issued', 'Paid', 'Void'];
  protected readonly filter = signal<InvoiceFilter>({ status: '', overdue: false, page: 1, pageSize: 15 });
  protected readonly page = httpResource<PagedResult<Invoice>>(() => BillingApi.urls.invoices(this.filter()));
  protected readonly pageCount = computed(() => {
    const p = this.page.value();
    return p ? Math.max(1, Math.ceil(p.totalCount / p.pageSize)) : 1;
  });

  protected readonly selected = signal<Invoice | null>(null);
  protected paymentAmount: number | null = null;

  /** Changing a filter resets to page 1; changing only the page keeps the filter. */
  protected setFilter(change: Partial<InvoiceFilter>) {
    this.filter.update((f) => ({ ...f, ...change, page: change.page ?? 1 }));
  }

  protected pdfUrl(i: Invoice) {
    return BillingApi.urls.invoicePdf(i.id);
  }

  protected pay(i: Invoice) {
    const amount = this.paymentAmount ?? i.amountDue;
    this.api.recordPayment(i.id, amount).subscribe((updated) => {
      this.toasts.success(updated.status === 'Paid' ? `${updated.number} is paid in full.` : `Payment recorded on ${updated.number}.`);
      this.selected.set(updated);
      this.paymentAmount = null;
      this.page.reload();
    });
  }
}
