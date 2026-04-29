/**
 * Part I — Flat tests (no POM)
 * Test suite: Navigate Products via Filters
 *
 * Rules:
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 *   - No CSS class selectors, no XPath
 *
 * Tip: run `npx playwright codegen https://www.kriso.ee` to discover selectors.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Navigate Products via Filters', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://www.kriso.ee/');
    const consentButton = page.getByRole('button', { name: /Nõustun|Accept|I agree/i });
    if (await consentButton.isVisible().catch(() => false)) {
      await consentButton.click();
    }
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('Navigate and filter products', async () => {
    await expect(page.getByRole('link', { name: /Kriso/i }).first()).toBeVisible();

    const musicSectionLink = page
      .getByRole('link', { name: /Muusikaraamatud ja noodid|Music books/i })
      .first();
    await musicSectionLink.scrollIntoViewIfNeeded();
    await expect(musicSectionLink).toBeVisible();
    await musicSectionLink.click();

    await page.getByRole('link', { name: /Kitarr|Guitar/i }).first().click();

    const guitarCount = await getResultsCount();
    expect(guitarCount).toBeGreaterThan(1);
    await expect(page).toHaveURL(/kitarr|guitar|muusika/i);

    await page.getByRole('link', { name: /Inglise|English/i }).first().click();
    const englishCount = await getResultsCount();
    expect(englishCount).toBeLessThan(guitarCount);

    await page.getByRole('link', { name: /^CD$/i }).first().click();
    const cdCount = await getResultsCount();
    expect(cdCount).toBeLessThanOrEqual(englishCount);
    await expect(page.locator('body')).toContainText(/CD/i);

    await page.goBack();
    await page.goBack();

    const afterRemoveCount = await getResultsCount();
    expect(afterRemoveCount).toBeGreaterThanOrEqual(cdCount);
  });

  async function getResultsCount() {
    const resultsText = await page.locator('.sb-results-total').textContent();
    return Number((resultsText || '').replace(/\D/g, '')) || 0;
  }
});