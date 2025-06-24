import { expect } from '@playwright/test';

/**
 * Helper function to login with given credentials
 * @param {import('@playwright/test').Page} page 
 * @param {Object} credentials 
 * @param {string} credentials.username
 * @param {string} credentials.password
 */
export async function login(page, { username, password }) {
  await page.goto('/');
  
  // Check if already logged in
  const isLoggedIn = await page.locator('[data-testid="logout-button"]').isVisible({ timeout: 2000 }).catch(() => false);
  if (isLoggedIn) {
    return;
  }

  // Fill login form
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login
  await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 10000 });
}

/**
 * Helper function to logout
 * @param {import('@playwright/test').Page} page 
 */
export async function logout(page) {
  const logoutButton = page.locator('[data-testid="logout-button"]');
  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Helper function to navigate to a protected route
 * @param {import('@playwright/test').Page} page 
 * @param {string} route 
 */
export async function navigateToProtectedRoute(page, route) {
  await page.goto(route);
  
  // If redirected to login, we're not authenticated
  await page.waitForLoadState('networkidle');
  const currentUrl = page.url();
  
  if (currentUrl.includes('/login') || currentUrl === `${page.url().split('/').slice(0, 3).join('/')}/`) {
    throw new Error(`Redirected to login when accessing ${route}`);
  }
}