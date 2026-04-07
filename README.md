# Playwright Test Automation – Kriso.ee Webshop

E2E test automation for [Kriso.ee](https://www.kriso.ee) bookshop using [Playwright](https://playwright.dev).

**Slides:** https://tanjaq.github.io/playwright-kriso/slides/

Your task is to create automated tests and a CI pipeline based on the descriptions below.

---

## ⚠️ How to Submit

> **You must do both of these — missing either means your work won't be graded.**

1. **Open a Pull Request** to the original repository: [github.com/tanjaq/playwright-kriso](https://github.com/tanjaq/playwright-kriso)
2. **Paste the link to a passing CI run** in the PR description (GitHub Actions → your workflow run → copy the URL)

---

## How to Get Started

1. **Fork** this repository into your own GitHub account
2. **Clone** the forked repository to your local machine:
   ```bash
   git clone <your-repo-url>
   ```
3. **Install dependencies:**
   ```bash
   npm install
   npx playwright install
   ```
4. **Write tests** based on the test case descriptions below
5. **Run tests** locally to confirm they pass:
   ```bash
   npx playwright test
   ```
6. **Commit and push** your changes to your fork
7. **Open a Pull Request** to `tanjaq/playwright-kriso` ← do not skip this
8. **Add the CI link** to your PR description ← do not skip this

---

## Project Structure

```
tests/
  flat/
    search.spec.ts      ← Task 1: flat tests — Search for Books by Keywords
    cart.spec.ts        ← Task 1: flat tests — Add Books to Shopping Cart
    filters.spec.ts     ← Task 1: flat tests — Navigate Products via Filters
  pom/
    search.pom.spec.ts  ← Task 2: POM tests — Search for Books by Keywords
    cart.pom.spec.ts    ← Task 2: POM tests — Add Books to Shopping Cart
    filters.pom.spec.ts ← Task 2: POM tests — Navigate Products via Filters

pages/                  ← Task 2: Page Object Model classes
  HomePage.ts           ← home page, search, add to cart
  CartPage.ts           ← cart quantities, totals, remove items
  ProductPage.ts        ← product detail page

.github/workflows/
  playwright.yml        ← Task 3: CI pipeline (fill in the TODOs)

playwright.config.ts    ← Playwright configuration
```

### Useful commands

```bash
# Interactive UI mode (recommended during development)
npx playwright test --ui

# Headed mode — watch the browser
npx playwright test --headed

# Run only a specific test file
npx playwright test tests/flat/cart.spec.ts

# Record new tests against Kriso
npx playwright codegen https://www.kriso.ee

# View the HTML report after a run
npx playwright show-report
```

---

## Test Cases

### Task 1 — Flat Tests (`tests/flat/`)

#### Search for Books by Keywords

| Steps | Expected Result (Assertions) |
|-------|------------------------------|
| Open https://www.kriso.ee | Confirm the page has a Kriso title/logo |
| Search for keyword "harry potter" | Confirm multiple products are shown |
| | All listed items contain the searched keyword in their title or description |
| Filter by language (e.g., English) | Verify only products in that language appear |
| Filter by format (e.g., "Kõvakaaneline" / hardback) | Confirm fewer items are listed and all match the selected format |

#### Add Books to Shopping Cart

| Steps | Expected Result (Assertions) |
|-------|------------------------------|
| Open https://www.kriso.ee | Confirm the page has a Kriso title/logo |
| Search for any keyword | Confirm multiple results are shown |
| | Products can be added to the shopping cart |
| Add one book to the cart | Confirm the cart shows 1 item |
| Add a second book | Confirm the cart updates to show 2 items |
| Click the cart/checkout icon | Confirm the user is navigated to the cart view |
| | Verify cart contains 2 correct items |
| | Verify the total price is accurate |
| Remove the first item from cart | Confirm the cart now shows 1 item |
| | Confirm the correct item was removed |
| | Verify the total price updates accordingly |

#### Navigate Products via Filters

| Steps | Expected Result (Assertions) |
|-------|------------------------------|
| Open https://www.kriso.ee | Confirm the page has a Kriso title/logo |
| Scroll down to find a section like "Muusikaraamatud ja noodid" | Confirm the section is visible |
| Click the "Õppematerjalid" category | Verify that there are more than 1 products found |
| | Confirm URL or page title reflects navigation correctly |
| Click on a category ("Bänd ja ansambel") | Confirm active filters show the selected category |
| | Verify products list now contains less items |
| Click on a format category ("CD") | Confirm active filters show the selected category |
| | Verify products list now contains less items |

---

### Task 2 — Page Object Model (`tests/pom/`)

Refactor your Task 1 tests to use the Page Object Model:

- All locators and actions live in page classes under `pages/` — no raw selectors in test files
- All POM test files use `beforeAll` + `test.describe.configure({ mode: 'serial' })`, the same pattern as `cart.pom.spec.ts`

---

### Task 3 — CI/CD Pipeline (`.github/workflows/playwright.yml`)

Complete the scaffolded workflow file so your tests run automatically in the cloud on every push and pull request.

**The pipeline must:**

- Trigger on push to `main` and on pull requests targeting `main`
- Run on a Linux machine
- Install Node.js and npm dependencies
- Install the Playwright browser binaries
- Execute all tests
- Upload the HTML report as an artifact (even when tests fail)

Open `.github/workflows/playwright.yml` — each step has a `# TODO` comment explaining what to add. Fill in the blanks, push, then open the **Actions** tab in your GitHub repository to confirm the run goes green.

> **Submitting:** copy the URL of the passing Actions run and paste it into your Pull Request description.
