// Shapes returned by the billing-service API (https://github.com/Al7assan1999/billing-service).

export type SubscriptionStatus = 'Active' | 'Cancelled';
export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Void';

export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startedOn: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledOn: string | null;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string | null;
  customerId: string;
  customerName: string;
  status: InvoiceStatus;
  isOverdue: boolean;
  currency: string;
  issuedOn: string | null;
  dueOn: string | null;
  paidOn: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  lines: InvoiceLine[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface DashboardSummary {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  outstanding: number;
  overdueInvoices: number;
  overdueAmount: number;
  revenueLast6Months: { month: string; amount: number }[];
}

export interface InvoiceFilter {
  status?: InvoiceStatus | '';
  overdue?: boolean;
  page: number;
  pageSize: number;
}
