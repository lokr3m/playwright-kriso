import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartPage } from './CartPage';
import { ProductPage } from './ProductPage';

export class HomePage extends BasePage {
  private readonly url = 'https://www.kriso.ee/';
  private readonly resultsTotal: Locator;
  private readonly addToCartLinks: Locator;
  private readonly addToCartMessage: Locator;
  private readonly cartCount: Locator;
  private readonly backButton: Locator;
  private readonly forwardButton: Locator;
  private readonly noResultsMessage: Locator;
  private readonly pageBody: Locator;
  private readonly fallbackSearchTerms = ['harry potter', 'tolkien'];

  constructor(page: Page) {
    super(page);
    this.resultsTotal = this.page.locator('.sb-results-total');
    this.addToCartLinks = this.page.getByRole('link', { name: /Lisa ostukorvi|Add to cart/i });
    this.addToCartMessage = this.page.locator('.item-messagebox');
    this.cartCount = this.page.locator('.cart-products');
    this.backButton = this.page.locator('.cartbtn-event.back');
    this.forwardButton = this.page.locator('.cartbtn-event.forward');
    this.noResultsMessage = this.page.locator('.msg.msg-info');
    this.pageBody = this.page.locator('body');
  }

  async openUrl() {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
  }

  async getResultsCount() {
    const resultsText = await this.resultsTotal.first().textContent();
    return Number((resultsText || '').replace(/\D/g, '')) || 0;
  }

  async verifyResultsCountMoreThan(minCount: number) {
    expect(await this.getResultsCount()).toBeGreaterThan(minCount);
  }

  async verifyResultsContainKeyword(keyword: string) {
    const keywordLinks = this.page.getByRole('link', { name: new RegExp(keyword, 'i') });
    const keywordLinkCount = await keywordLinks.count();
    expect(keywordLinkCount).toBeGreaterThan(1);

    const bodyText = (await this.pageBody.innerText()).toLowerCase();
    expect(bodyText).toContain(keyword.toLowerCase());
  }

  async verifyBookShown(title: string) {
    await expect(this.page.getByRole('link', { name: new RegExp(title, 'i') }).first()).toBeVisible();
  }

  async verifyIsbnShown(isbn: string) {
    await expect(this.page.getByText(new RegExp(isbn)).first()).toBeVisible();
  }

  async openMusicBooksCategory() {
    const sectionLink = this.page
      .getByRole('link', { name: /Muusikaraamatud ja noodid|Music books/i })
      .first();

    if (await sectionLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sectionLink.click();
      return new ProductPage(this.page);
    }

    await this.page.goto('https://www.kriso.ee/muusika-ja-noodid.html', {
      waitUntil: 'domcontentloaded',
    });

    return new ProductPage(this.page);
  }

  async searchFor(keyword: string) {
    const preferredInput = this.page
      .getByRole('textbox', { name: /Pealkiri|Title|ISBN|märksõna|keyword/i })
      .first();

    const input = (await preferredInput.isVisible().catch(() => false))
      ? preferredInput
      : this.page.getByRole('textbox').first();

    await input.fill(keyword);

    const searchButton = this.page.getByRole('button', { name: /Search|Otsi/i }).first();
    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
    } else {
      await input.press('Enter');
    }

    // Robust wait: results counter exists on results pages
    await expect(this.resultsTotal.first()).toBeVisible({ timeout: 15_000 });
  }

  async addToCartByIndex(index: number) {
    await this.clickVisibleAddToCartByIndex(index);
  }

  async verifyAddToCartMessage() {
    await expect(this.addToCartMessage).toContainText(/Toode lisati ostukorvi|added to (shopping )?cart/i);
  }

  async verifyCartCount(expectedCount: number) {
    await expect(this.cartCount).toContainText(expectedCount.toString());
  }

  async goBackFromCart() {
    await this.backButton.click();
  }

  async openShoppingCart() {
    await this.forwardButton.click();
    return new CartPage(this.page);
  }

  async verifyNoProductsFoundMessage() {
    await expect(this.noResultsMessage).toBeVisible();
    await expect(this.noResultsMessage).toContainText(/ei leitud|did not find any match/i);
  }

  // Kept for compatibility with existing code; no longer required by addToCartByIndex flow.
  private async ensureAddToCartLinksAvailable() {
    for (const term of this.fallbackSearchTerms) {
      if (await this.hasVisibleAddToCartLinks()) {
        return;
      }

      await this.searchByKeyword(term);
    }
  }

  // Kept for compatibility with existing code; no longer required by addToCartByIndex flow.
  private async hasVisibleAddToCartLinks(): Promise<boolean> {
    const count = await this.addToCartLinks.count();
    const maxChecks = Math.min(count, 20);

    for (let index = 0; index < maxChecks; index += 1) {
      if (await this.addToCartLinks.nth(index).isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  private async clickVisibleAddToCartByIndex(index: number) {
    // Wait for results page
    await expect(this.resultsTotal.first()).toBeVisible({ timeout: 15_000 });

    // Click product link from results.
    // More robust than keyword anchors: take first links with any non-empty name,
    // then filter by visibility.
    const allLinks = this.page.getByRole('link');
    const total = await allLinks.count();

    const visibleProductLinkIndexes: number[] = [];
    const maxChecks = Math.min(total, 80);

    for (let i = 0; i < maxChecks; i += 1) {
      const link = allLinks.nth(i);
      const name = (await link.innerText().catch(() => '')).trim();
      if (!name) continue;

      // Skip obvious nav links
      if (
        /bestsellers|e-platforms|books in stock|help|log in|new account|categories|books|e-books/i.test(
          name
        )
      ) {
        continue;
      }

      if (await link.isVisible().catch(() => false)) {
        visibleProductLinkIndexes.push(i);
      }

      if (visibleProductLinkIndexes.length >= 10) break;
    }

    if (visibleProductLinkIndexes.length === 0) {
      throw new Error('No visible product links found on the results page.');
    }

    const safeVisibleIndex = Math.min(index, visibleProductLinkIndexes.length - 1);
    await allLinks.nth(visibleProductLinkIndexes[safeVisibleIndex]).click();

    // Now on product page: click add-to-cart
    const addToCart = this.page
      .getByRole('button', { name: /Lisa ostukorvi|Ostukorvi|Add to cart/i })
      .or(this.page.getByRole('link', { name: /Lisa ostukorvi|Ostukorvi|Add to cart/i }))
      .first();

    await expect(addToCart).toBeVisible({ timeout: 15_000 });
    await addToCart.click();
  }
}