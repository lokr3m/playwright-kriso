import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  private readonly searchBaseUrl = 'https://www.kriso.ee/cgi-bin/shop/searchbooks.html';
  private readonly resultsTotal: Locator;
  private readonly body: Locator;

  constructor(page: Page) {
    super(page);
    this.resultsTotal = this.page.locator('.sb-results-total');
    this.body = this.page.locator('body');
  }

  async openGuitarCategory() {
    const kitarrLink = this.page.getByRole('link', { name: /Kitarr|Guitar/i }).first();

    if (await kitarrLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await kitarrLink.click();
      return;
    }

    await this.page.goto(
      this.buildSearchUrl({ tt: '', database: 'musicsales', instrument: 'Guitar' }),
      { waitUntil: 'domcontentloaded' },
    );
  }

  async applyEnglishLanguageFilter() {
    const englishLink = this.page.getByRole('link', { name: /Inglise|English/i }).first();

    if (await englishLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await englishLink.click();
      return;
    }

    await this.page.goto(
      this.buildSearchUrl({ database: 'musicsales', instrument: 'Guitar', mlanguage: 'English' }),
      { waitUntil: 'domcontentloaded' },
    );
  }

  async applyCdFormatFilter() {
    const cdLink = this.page.getByRole('link', { name: /^CD$/i }).first();

    if (await cdLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cdLink.click();
      return;
    }

    await this.page.goto(
      this.buildSearchUrl({
        database: 'musicsales',
        instrument: 'Guitar',
        mlanguage: 'English',
        format: 'CD',
      }),
      { waitUntil: 'domcontentloaded' },
    );
  }

  async getResultsCount() {
    const text = await this.resultsTotal.first().textContent();
    return Number((text || '').replace(/\D/g, '')) || 0;
  }

  async verifyResultsCountMoreThan(minCount: number) {
    expect(await this.getResultsCount()).toBeGreaterThan(minCount);
  }

  async verifyActiveFiltersContain(text: string) {
    await expect(this.body).toContainText(new RegExp(text, 'i'));
  }

  async removeFiltersByGoingBack(times = 2) {
    for (let i = 0; i < times; i += 1) {
      await this.page.goBack();
    }
  }

  private buildSearchUrl(params: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    return `${this.searchBaseUrl}?${searchParams.toString()}`;
  }
}