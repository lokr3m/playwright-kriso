/**
 * Part I — Flat tests (no POM)
 * Test suite: Add Books to Shopping Cart
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
let basketSumOfTwo = 0;

test.describe('Add Books to Shopping Cart', () => {

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

  test('Test search by keyword', async () => {
    await searchFor('harry potter');

    // parse numeric total from the results text and assert it's > 1
    expect(await getResultsCount()).toBeGreaterThan(1);
  });

  test('Test add book to cart', async () => {
    await addToCartByIndex(0);
    await expect(page.locator('.item-messagebox')).toContainText(/Toode lisati ostukorvi|added to (shopping )?cart/i);
    await expect(page.locator('.cart-products')).toContainText('1');
    await page.locator('.cartbtn-event.back').click();
  });

  test('Test add second book to cart', async () => {
    await addToCartByIndex(1);
    await expect(page.locator('.item-messagebox')).toContainText(/Toode lisati ostukorvi|added to (shopping )?cart/i);
    await expect(page.locator('.cart-products')).toContainText('2');
  });

  test('Test cart count and sum is correct', async () => {
    await page.locator('.cartbtn-event.forward').click();
    await expect(page.locator('.order-qty > .o-value')).toContainText('2');
    await expect(page.locator('.tbl-row .title a')).toHaveCount(2);
    const cartTitles = (await page.locator('.tbl-row .title a').allTextContents())
      .map((title) => title.trim())
      .filter(Boolean);
    expect(new Set(cartTitles).size).toBe(2);

    basketSumOfTwo = await returnBasketSum();
    let basketSumTotal = await returnBasketSumTotal();

    expect(basketSumTotal).toBeCloseTo(basketSumOfTwo, 2);
  });


  test('Test remove item from cart and counter sum is correct', async () => {
    const removedItemTitle = ((await page.locator('.tbl-row .title a').first().textContent()) || '').trim();
    await page.locator('.icon-remove').nth(0).click();
    await expect(page.locator('.order-qty > .o-value')).toContainText('1');

    let basketSumOfOne = await returnBasketSum();
    let basketSumTotal = await returnBasketSumTotal();
    
    expect(basketSumTotal).toBeCloseTo(basketSumOfOne, 2);
    expect(basketSumOfOne).toBeLessThan(basketSumOfTwo);
    await expect(page.locator('.tbl-row .title a')).toHaveCount(1);
    if (removedItemTitle) {
      await expect(page.locator('.tbl-row .title a').first()).not.toHaveText(removedItemTitle);
    }
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

  async function getResultsCount() {
    const resultsText = await page.locator('.sb-results-total').textContent();
    return Number((resultsText || '').replace(/\D/g, '')) || 0;
  }

  async function addToCartByIndex(index: number) {
    const addToCartLinks = page.getByRole('link', { name: /Lisa ostukorvi|Add to cart/i });
    const count = await addToCartLinks.count();

    const visibleIndexes: number[] = [];
    const maxChecks = Math.min(count, 20);

    for (let i = 0; i < maxChecks; i += 1) {
      if (await addToCartLinks.nth(i).isVisible().catch(() => false)) {
        visibleIndexes.push(i);
      }
    }

    if (visibleIndexes.length > 0) {
      await addToCartLinks.nth(visibleIndexes[Math.min(index, visibleIndexes.length - 1)]).click();
      return;
    }

    if (count > 0) {
      await addToCartLinks.nth(Math.min(index, count - 1)).click();
      return;
    }

    throw new Error('No add-to-cart links found on the page.');
  }

  async function returnBasketSum() {
    let basketSum = 0;

    let cartItems = await page.locator('.tbl-row > .subtotal').all();

    for (const item of cartItems) {
      const text = await item.textContent();
      const price = Number((text || '').replace(/[^0-9.,]+/g, '').replace(',', '.')) || 0;
      basketSum += price;
    }

    return basketSum;
  }

  async function returnBasketSumTotal() {
    let basketSumTotalText = await page.locator('.order-total > .o-value').textContent();
    let basketSumTotal = Number((basketSumTotalText || '').replace(/[^0-9.,]+/g, '').replace(',', '.')) || 0;
    return basketSumTotal;
  }

});