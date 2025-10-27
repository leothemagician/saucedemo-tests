import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.saucedemo.com/';

// Re-usable locators helper (keeps tests readable)
const locators = {
  username: "input[data-test='username']",
  password: "input[data-test='password']",
  loginButton: "input[data-test='login-button']",
  addBackpack: "button[data-test='add-to-cart-sauce-labs-backpack']",
  removeBackpack: "button[data-test='remove-sauce-labs-backpack']",
  cartBadge: "span[data-test='shopping-cart-badge']",
  inventoryPrices: "div.inventory_item_price",
  burgerMenuBtn: "button[id='react-burger-menu-btn']",
  logoutLink: "a[id='logout_sidebar_link']",
  errorMsg: "[data-test='error']",
  productsTitle: ".title",
  sortSelect: "select[data-test='product-sort-container']"
};

// Grouping Saucedemo tests together
test.describe('Saucedemo UI tests', () => {

  // Tests that require a logged-in user will use this beforeEach
  test.describe('Authenticated flows', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
      await page.locator(locators.username).fill('standard_user');
      await page.locator(locators.password).fill('secret_sauce');
      await page.locator(locators.loginButton).click();
      // verify login succeeded
      await expect(page).toHaveURL(/inventory.html/);
      await expect(page.locator(locators.productsTitle)).toHaveText('Products');
    });

    test('Add to Cart Test - Saucedemo', async ({ page }) => {
      const addToCartBtn = page.locator(locators.addBackpack);
      const cartBadge = page.locator(locators.cartBadge);

      await addToCartBtn.click();

      await expect(cartBadge).toBeVisible();
      await expect(cartBadge).toHaveText('1');
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('Remove from Cart Test - Saucedemo', async ({ page }) => {
      const addToCartBtn = page.locator(locators.addBackpack);
      const removeBtn = page.locator(locators.removeBackpack);
      const cartBadge = page.locator(locators.cartBadge);

      // Add then remove
      await addToCartBtn.click();
      await expect(cartBadge).toBeVisible();
      await expect(cartBadge).toHaveText('1');

      await removeBtn.click();
      // badge should disappear after removal
      await expect(cartBadge).not.toBeVisible();
      await expect(page).toHaveURL(/inventory.html/);
    });

    test('Filter products test - Price low to high', async ({ page }) => {
      // Select Price: low to high (value 'lohi' on saucedemo)
      await page.locator(locators.sortSelect).selectOption('lohi');

      const pricesLocator = page.locator(locators.inventoryPrices);
      await expect(pricesLocator.first()).toBeVisible();

      const pricesTexts = await pricesLocator.allTextContents(); // ["$7.99", "$9.99", ...]
      const prices = pricesTexts.map(t => parseFloat(t.replace('$', '').trim()));

      expect(prices.length).toBeGreaterThan(1);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }

      await expect(page).toHaveURL(/inventory.html/);
    });

    test('Logout Test - Saucedemo', async ({ page }) => {
      // Open burger menu and logout
      await page.locator(locators.burgerMenuBtn).click();
      const logoutLink = page.locator(locators.logoutLink);
      await logoutLink.waitFor({ state: 'visible' });
      await logoutLink.click();

      await expect(page).toHaveURL(BASE_URL);
    });
  });

  // Tests that should run without prior authentication
  test('Login Test - Saucedemo', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(locators.username).fill('standard_user');
    await page.locator(locators.password).fill('secret_sauce');
    await page.locator(locators.loginButton).click();

    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.locator(locators.productsTitle)).toHaveText('Products');
  });

  test('Invalid Login Test - Saucedemo', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator(locators.username).fill('invalid_user');
    await page.locator(locators.password).fill('wrong_password');
    await page.locator(locators.loginButton).click();

    const errorMsg = page.locator(locators.errorMsg);
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Username and password do not match');
    await expect(page).toHaveURL(BASE_URL);
  });

});
