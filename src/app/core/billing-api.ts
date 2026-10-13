import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Customer, Invoice, InvoiceFilter, Plan, Subscription } from './models';

/** URL builders for reads (used with httpResource) and methods for writes. */
@Injectable({ providedIn: 'root' })
export class BillingApi {
  private readonly http = inject(HttpClient);

  static readonly urls = {
    dashboard: '/api/dashboard',
    customers: '/api/customers',
    plans: '/api/plans',
    subscriptions: '/api/subscriptions',
    invoices: (f: InvoiceFilter) => `/api/invoices?${BillingApi.invoiceParams(f).toString()}`,
    invoicePdf: (id: string) => `/api/invoices/${id}/pdf`,
  };

  static invoiceParams(f: InvoiceFilter): HttpParams {
    let params = new HttpParams().set('page', f.page).set('pageSize', f.pageSize);
    if (f.status) params = params.set('status', f.status);
    if (f.overdue) params = params.set('overdue', true);
    return params;
  }

  createCustomer(body: { name: string; email: string }) {
    return this.http.post<Customer>('/api/customers', body);
  }

  createPlan(body: { name: string; monthlyPrice: number; currency: string }) {
    return this.http.post<Plan>('/api/plans', body);
  }

  retirePlan(id: string) {
    return this.http.post<void>(`/api/plans/${id}/retire`, {});
  }

  startSubscription(body: { customerId: string; planId: string; startDate?: string | null }) {
    return this.http.post<{ subscription: Subscription; invoice: Invoice }>('/api/subscriptions', body);
  }

  changePlan(subscriptionId: string, planId: string) {
    return this.http.post<Invoice>(`/api/subscriptions/${subscriptionId}/change-plan`, { planId });
  }

  cancelSubscription(id: string) {
    return this.http.post<void>(`/api/subscriptions/${id}/cancel`, {});
  }

  recordPayment(invoiceId: string, amount: number) {
    return this.http.post<Invoice>(`/api/invoices/${invoiceId}/payments`, { amount });
  }

  voidInvoice(invoiceId: string, reason: string) {
    return this.http.post<Invoice>(`/api/invoices/${invoiceId}/void`, { reason });
  }

  runBilling() {
    return this.http.post<{ runDate: string; invoicesIssued: number }>('/api/billing-runs', {});
  }
}
