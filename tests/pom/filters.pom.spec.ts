/**
 * Part II — Page Object Model tests
 * Test suite: Navigate Products via Filters
 *
 * Rules:
 *   - No raw selectors in test files — all locators live in page classes
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductPage } from '../../pages/ProductPage';

test.describe.configure({ mode: 'serial' });

test.describe('Navigate Products via Filters (POM)', () => {
  let page: Page;
  let homePage: HomePage;
  let productPage: ProductPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    homePage = new HomePage(page);

    await homePage.openUrl();
    await homePage.acceptCookies();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('Navigate and filter products', async () => {
    await homePage.verifyLogo();

    productPage = await homePage.openMusicBooksCategory();
    await productPage.openGuitarCategory();
    await productPage.verifyResultsCountMoreThan(1);
    const guitarCount = await productPage.getResultsCount();

    await productPage.applyEnglishLanguageFilter();
    const englishCount = await productPage.getResultsCount();
    expect(englishCount).toBeLessThan(guitarCount);

    await productPage.applyCdFormatFilter();
    const cdCount = await productPage.getResultsCount();
    expect(cdCount).toBeLessThanOrEqual(englishCount);
    await productPage.verifyActiveFiltersContain('CD');

    await productPage.removeFiltersByGoingBack(2);
    const afterRemoveCount = await productPage.getResultsCount();
    expect(afterRemoveCount).toBeGreaterThanOrEqual(cdCount);
  });
});