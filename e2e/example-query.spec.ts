import { test, expect } from '@playwright/test';

test('user can run an example disease query and see results', async ({ page }) => {
  await page.goto('/');

  // Accept disclaimer
  await page.getByRole('button', { name: 'accept disclaimer' }).click();

  // Select drug-disease query
  await page.getByTestId('drug-disease-selector').click();

  // Select Type 2 Diabetes Mellitus
  await page.getByTestId('Type 2 Diabetes Mellitus').click();

  // Wait for results
  const response = await page.waitForResponse(
    (resp) => resp.url().includes('/result') && resp.status() === 200,
    { timeout: 60_000 },
  );
  const body = await response.json();
  expect(body.status).toBe('success');

  // Verify share button is accessible
  await expect(page.getByTestId('share-button')).toBeVisible();
});
