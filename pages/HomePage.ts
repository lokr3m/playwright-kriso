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

  async addToCartByIndex(index: number) {
    await this.ensureAddToCartLinksAvailable();
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

  private async ensureAddToCartLinksAvailable() {
    for (const term of this.fallbackSearchTerms) {
      if (await this.hasVisibleAddToCartLinks()) {
        return;
      }

      await this.searchByKeyword(term);
    }
  }

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
    const count = await this.addToCartLinks.count();
    const visibleIndexes: number[] = [];
    const maxChecks = Math.min(count, 20);

    for (let i = 0; i < maxChecks; i += 1) {
      if (await this.addToCartLinks.nth(i).isVisible().catch(() => false)) {
        visibleIndexes.push(i);
      }
    }

    if (visibleIndexes.length > 0) {
      const safeVisibleIndex = Math.min(index, visibleIndexes.length - 1);
      await this.addToCartLinks.nth(visibleIndexes[safeVisibleIndex]).click();
      return;
    }

    if (count > 0) {
      const safeIndex = Math.min(index, count - 1);
      await this.addToCartLinks.nth(safeIndex).click();
      return;
    }
    throw new Error('No add-to-cart links found on the page.');
  }
}