import { HttpErrorResponse } from '@angular/common/http';
import { BillingApi } from './billing-api';
import { problemMessage } from './error.interceptor';

describe('BillingApi.invoiceParams', () => {
  it('always sends paging and only the filters that are set', () => {
    expect(BillingApi.invoiceParams({ page: 2, pageSize: 15 }).toString()).toBe('page=2&pageSize=15');
    expect(BillingApi.invoiceParams({ page: 1, pageSize: 15, status: '', overdue: false }).toString()).toBe('page=1&pageSize=15');
    expect(BillingApi.invoiceParams({ page: 1, pageSize: 15, status: 'Issued', overdue: true }).toString()).toBe(
      'page=1&pageSize=15&status=Issued&overdue=true',
    );
  });
});

describe('problemMessage', () => {
  const error = (status: number, body: unknown) => new HttpErrorResponse({ status, error: body });

  it('uses the detail of a problem response', () => {
    expect(problemMessage(error(422, { title: 'Business rule violated', detail: 'Payment exceeds the amount due.' }))).toBe(
      'Payment exceeds the amount due.',
    );
  });

  it('flattens ASP.NET validation errors', () => {
    expect(problemMessage(error(400, { errors: { Name: ['Name is required.'], Email: ['Email is invalid.'] } }))).toBe(
      'Name is required. Email is invalid.',
    );
  });

  it('explains when the API is unreachable', () => {
    expect(problemMessage(error(0, null))).toBe('Cannot reach the billing API.');
  });
});
