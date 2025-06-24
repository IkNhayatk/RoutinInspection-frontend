import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-users.js';
import { login } from './utils/auth-helpers.js';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, testUsers.admin);
  });

  test('should display user management page for admin users', async ({ page }) => {
    await page.goto('/user-management');
    
    await expect(page.locator('[data-testid="user-management-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-user-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });

  test('should open add user modal when clicking add user button', async ({ page }) => {
    await page.goto('/user-management');
    
    await page.click('[data-testid="add-user-button"]');
    
    await expect(page.locator('[data-testid="user-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-modal-title"]')).toContainText('Add User');
  });

  test('should create a new user successfully', async ({ page }) => {
    await page.goto('/user-management');
    
    await page.click('[data-testid="add-user-button"]');
    
    // Fill user form
    await page.fill('[data-testid="modal-username"]', 'newuser');
    await page.fill('[data-testid="modal-userid"]', 'NU001');
    await page.fill('[data-testid="modal-password"]', 'password123');
    await page.fill('[data-testid="modal-email"]', 'newuser@test.com');
    await page.selectOption('[data-testid="modal-priority"]', '1');
    await page.fill('[data-testid="modal-position"]', 'Test Position');
    await page.fill('[data-testid="modal-department"]', 'Test Department');
    
    await page.click('[data-testid="modal-submit"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    
    // Modal should close
    await expect(page.locator('[data-testid="user-modal"]')).not.toBeVisible();
  });

  test('should edit an existing user', async ({ page }) => {
    await page.goto('/user-management');
    
    // Click edit button for first user
    await page.click('[data-testid="edit-user-button"]:first-child');
    
    await expect(page.locator('[data-testid="user-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-modal-title"]')).toContainText('Edit User');
    
    // Update user information
    await page.fill('[data-testid="modal-email"]', 'updated@test.com');
    
    await page.click('[data-testid="modal-submit"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should delete a user', async ({ page }) => {
    await page.goto('/user-management');
    
    // Click delete button for first user
    await page.click('[data-testid="delete-user-button"]:first-child');
    
    // Should show confirmation modal
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should filter users by department', async ({ page }) => {
    await page.goto('/user-management');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Select a department filter
    await page.selectOption('[data-testid="department-filter"]', 'IT');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="users-table"] tbody tr')).toHaveCount(1, { timeout: 5000 });
  });

  test('should search users by username', async ({ page }) => {
    await page.goto('/user-management');
    
    // Wait for users to load
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Search for a specific user
    await page.fill('[data-testid="search-input"]', 'admin');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="users-table"] tbody tr')).toHaveCount(1, { timeout: 5000 });
  });
});