import { expect, test } from '@playwright/test';

// One run through the whole admin workflow, with a unique customer so reruns don't collide.
test('set up a plan and customer, subscribe, and collect the first invoice', async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const planName = `Pro ${suffix}`;
  const customerName = `Acme ${suffix}`;

  await test.step('create a plan', async () => {
    await page.goto('/plans');
    await page.getByLabel('Name').fill(planName);
    await page.getByLabel('Monthly price').fill('200');
    await page.getByRole('button', { name: 'Add plan' }).click();
    await expect(page.getByRole('cell', { name: planName })).toBeVisible();
  });

  await test.step('create a customer', async () => {
    await page.goto('/customers');
    await page.getByLabel('Name').fill(customerName);
    await page.getByLabel('Email').fill(`billing-${suffix}@acme.test`);
    await page.getByRole('button', { name: 'Add customer' }).click();
    await expect(page.getByRole('cell', { name: customerName })).toBeVisible();
  });

  await test.step('start a subscription, which issues the first invoice', async () => {
    await page.goto('/subscriptions');
    await page.getByLabel('Customer', { exact: true }).selectOption({ label: customerName });
    const planOption = page.getByLabel('Plan', { exact: true }).locator('option', { hasText: planName });
    await page.getByLabel('Plan', { exact: true }).selectOption((await planOption.getAttribute('value'))!);
    await page.getByRole('button', { name: 'Start subscription' }).click();
    await expect(page.getByText(/Invoice INV-\d{4}-\d{6} issued for 230 SAR/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(customerName) })).toContainText('Active');
  });

  await test.step('record the payment on the invoice', async () => {
    await page.goto('/invoices');
    await page.getByLabel('Filter by status').selectOption('Issued');
    await page.getByRole('row', { name: new RegExp(customerName) }).click();

    const drawer = page.getByRole('complementary', { name: 'Invoice details' });
    await expect(drawer).toContainText('VAT 15%');
    await expect(drawer).toContainText(/230.00/);
    await drawer.getByRole('button', { name: 'Record payment' }).click();
    await expect(page.getByText(/is paid in full/)).toBeVisible();
    await page.getByLabel('Filter by status').selectOption('');
    await expect(page.getByRole('row', { name: new RegExp(customerName) })).toContainText('Paid');
    await page.screenshot({ path: 'e2e/screenshots/invoices.png' });
  });

  await test.step('dashboard reflects the new subscription', async () => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('active')).not.toHaveText('0');
    await expect(page.locator('.chart rect')).toHaveCount(6);
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png' });
  });
});
