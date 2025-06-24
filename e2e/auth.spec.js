import { test, expect } from '@playwright/test';
import { testUsers, invalidUser } from './fixtures/test-users.js';
import { login, logout } from './utils/auth-helpers.js';
import { setupTestEnvironment } from './utils/test-setup.js';

test.describe('Authentication Flow', () => {
  test.beforeAll(async () => {
    // Create test users before running tests
    await setupTestEnvironment();
  });

  test.beforeEach(async ({ page }) => {
    // Ensure we start from a logged out state
    await page.goto('/');
    await logout(page);
  });

  test('should display login form when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="username-input"]', testUsers.admin.username);
    await page.fill('[data-testid="password-input"]', testUsers.admin.password);
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard after successful login
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="username-input"]', invalidUser.username);
    await page.fill('[data-testid="password-input"]', invalidUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Should show error message and stay on login page
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, testUsers.admin);
    
    // Then logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="logout-button"]')).not.toBeVisible();
  });

  test('should redirect to login when accessing protected routes without authentication', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login page
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await login(page, testUsers.admin);
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle session timeout', async ({ page }) => {
    // This test might need to be adjusted based on your actual session timeout implementation
    await login(page, testUsers.admin);
    
    // Mock expired token scenario by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });
    
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 5000 });
  });
});