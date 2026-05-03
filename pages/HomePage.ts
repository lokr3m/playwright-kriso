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
    this.addToCartLinks = this.page.getByRole('link', { name: /Lisa ostukorvi|Add to (cart|basket)/i });
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
    await expect(this.addToCartMessage).toContainText(/Toode lisati ostukorvi|added to (shopping )?(cart|basket)/i);
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
    // If we're not on results page anymore, restart from home + search
    const resultsVisible = await this.resultsTotal.first().isVisible().catch(() => false);
    if (!resultsVisible) {
      await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
      await this.searchFor('tolkien');
    }

    // Wait for results page
    await expect(this.resultsTotal.first()).toBeVisible({ timeout: 15_000 });

    // Pick a "product-like" link on the results page without relying on DOM classes
    // or specific keywords (tolkien/harry potter/etc).
    const allLinks = this.page.getByRole('link');
    const total = await allLinks.count();

    const candidateIndexes: number[] = [];
    const maxChecks = Math.min(total, 140);

    for (let i = 0; i < maxChecks; i += 1) {
      const link = allLinks.nth(i);

      const text = ((await link.innerText().catch(() => '')) || '').trim();
      if (!text) continue;

      const lower = text.toLowerCase();

      // Skip obvious header/nav links
      if (
        /bestsellers|e-platforms|books in stock|help|log in|new account|categories|books|e-books|music books|language teaching materials|special offers|advanced search|shopping basket|wish list|your account|eng/.test(
          lower
        )
      ) {
        continue;
      }

      // Product titles are usually not super short
      if (text.length < 6) continue;

      if (await link.isVisible().catch(() => false)) {
        candidateIndexes.push(i);
      }

      if (candidateIndexes.length >= 25) break;
    }

    if (candidateIndexes.length === 0) {
      throw new Error('No product-like links found on the results page.');
    }

    const safe = Math.min(index, candidateIndexes.length - 1);
    await allLinks.nth(candidateIndexes[safe]).click();

    // Now on product page: click add-to-cart (multiple fallbacks)
    const addToCart = this.page
      .getByRole('button', { name: /Lisa ostukorvi|Ostukorvi|Add to (cart|basket)/i })
      .or(this.page.getByRole('link', { name: /Lisa ostukorvi|Ostukorvi|Add to (cart|basket)/i }))
      // common input submit buttons
      .or(
        this.page.locator(
          'input[type="submit"][value*="ostukorvi" i], input[type="submit"][value*="cart" i], input[type="submit"][value*="basket" i]'
        )
      )
      // common forms/buttons without good accessible name
      .or(this.page.locator('form[action*="cart" i] button, form[action*="basket" i] button'))
      .first();

    await expect(addToCart).toBeVisible({ timeout: 15_000 });
    await addToCart.click();
  }
}
