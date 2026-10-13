import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardSummary, PagedResult, Invoice } from '../core/models';
import { Dashboard } from './dashboard';
import { Invoices } from './invoices';

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return TestBed.inject(HttpTestingController);
}

describe('Dashboard', () => {
  it('shows the KPIs returned by the API', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    TestBed.tick();

    const summary: DashboardSummary = {
      activeSubscriptions: 12,
      monthlyRecurringRevenue: 4800,
      outstanding: 1150,
      overdueInvoices: 2,
      overdueAmount: 230,
      revenueLast6Months: [
        { month: '2026-05', amount: 1000 },
        { month: '2026-06', amount: 0 },
      ],
    };
    http.expectOne('/api/dashboard').flush(summary);
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="active"]')?.textContent).toContain('12');
    expect(el.querySelector('[data-testid="mrr"]')?.textContent).toContain('4,800');
    expect(el.querySelectorAll('.chart rect').length).toBe(2);
    http.verify();
  });
});

describe('Invoices', () => {
  const empty: PagedResult<Invoice> = { items: [], page: 1, pageSize: 15, totalCount: 0 };

  it('re-queries with the filter and resets to page 1 when a filter changes', async () => {
    const http = setup();
    const fixture = TestBed.createComponent(Invoices);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne('/api/invoices?page=1&pageSize=15').flush({ ...empty, totalCount: 40 });
    await fixture.whenStable();

    const component = fixture.componentInstance as unknown as { setFilter(c: object): void };
    component.setFilter({ page: 3 });
    TestBed.tick();
    http.expectOne('/api/invoices?page=3&pageSize=15').flush({ ...empty, page: 3, totalCount: 40 });
    await fixture.whenStable();

    component.setFilter({ status: 'Issued', overdue: true });
    TestBed.tick();
    http.expectOne('/api/invoices?page=1&pageSize=15&status=Issued&overdue=true').flush(empty);
    http.verify();
  });
});
