import { formatNumber } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

/** `1234.5 | money: 'SAR'` → "1,234.50 SAR" (amount first, ISO code after, as on the invoices). */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: number | null | undefined, currency: string, digits = '1.2-2'): string {
    return value == null ? '' : `${formatNumber(value, this.locale, digits)} ${currency}`;
  }
}
