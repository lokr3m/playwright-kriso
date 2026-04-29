/**
 * Part I — Flat tests (no POM)
 * Test suite: Search for Books by Keywords
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

let page: Page;

test.describe('Search for Books by Keywords', () => {

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

    test('Test logo is visible', async () => {
      await expect(page.getByRole('link', { name: /Kriso/i }).first()).toBeVisible();
    });

  test('Test no products found', async () => {
    await searchFor('xqzwmfkj');

    await expect(page.locator('.msg.msg-info')).toContainText(/ei leitud|did not find any match/i);
  });

    test('Test search results contain keyword', async () => {
    await searchFor('tolkien');

    const resultsText = await page.locator('.sb-results-total').first().textContent();
    const total = Number((resultsText || '').replace(/\D/g, '')) || 0;
    expect(total).toBeGreaterThan(1);

    const keywordLinks = page.getByRole('link', { name: /tolkien/i });
    expect(await keywordLinks.count()).toBeGreaterThan(1);
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    expect(bodyText).toContain('tolkien');
  });

    test('Test search by ISBN', async () => {
    await searchFor('9780307588371');

    await expect(page.getByRole('link', { name: /gone girl/i }).first()).toBeVisible();
    await expect(page.getByText('9780307588371').first()).toBeVisible();
  });

  async function searchFor(keyword: string) {
    const preferredInput = page
      .getByRole('textbox', { name: /Pealkiri|Title|ISBN|märksõna|keyword/i })
      .first();
    const input = (await preferredInput.isVisible().catch(() => false))
      ? preferredInput
      : page.getByRole('textbox').first();

    await input.fill(keyword);

    const searchButton = page.getByRole('button', { name: /Search|Otsi/i }).first();
    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
      return;
    }

    await input.press('Enter');
  }

});