import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-users.js';
import { login } from './utils/auth-helpers.js';

test.describe('Form Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, testUsers.admin);
  });

  test('should display form settings page', async ({ page }) => {
    await page.goto('/form-settings');
    
    await expect(page.locator('[data-testid="form-settings-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-form-button"]')).toBeVisible();
  });

  test('should open create form modal', async ({ page }) => {
    await page.goto('/form-settings');
    
    await page.click('[data-testid="create-form-button"]');
    
    await expect(page.locator('[data-testid="create-form-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-description-input"]')).toBeVisible();
  });

  test('should create a new form successfully', async ({ page }) => {
    await page.goto('/form-settings');
    
    await page.click('[data-testid="create-form-button"]');
    
    // Fill form details
    await page.fill('[data-testid="form-name-input"]', 'Test Inspection Form');
    await page.fill('[data-testid="form-description-input"]', 'A test form for inspection');
    
    // Add form elements
    await page.click('[data-testid="add-element-button"]');
    
    // Configure first element
    await page.fill('[data-testid="element-label"]', 'Equipment Status');
    await page.selectOption('[data-testid="element-type"]', 'select');
    await page.fill('[data-testid="element-options"]', 'Good,Fair,Poor');
    
    await page.click('[data-testid="save-form-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
    
    // Modal should close
    await expect(page.locator('[data-testid="create-form-modal"]')).not.toBeVisible();
  });

  test('should validate required form fields', async ({ page }) => {
    await page.goto('/form-settings');
    
    await page.click('[data-testid="create-form-button"]');
    
    // Try to save without filling required fields
    await page.click('[data-testid="save-form-button"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="form-name-error"]')).toBeVisible();
  });

  test('should edit an existing form', async ({ page }) => {
    await page.goto('/form-settings');
    
    // Click edit button for first form
    await page.click('[data-testid="edit-form-button"]:first-child');
    
    await expect(page.locator('[data-testid="create-form-modal"]')).toBeVisible();
    
    // Update form name
    await page.fill('[data-testid="form-name-input"]', 'Updated Form Name');
    
    await page.click('[data-testid="save-form-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should delete a form', async ({ page }) => {
    await page.goto('/form-settings');
    
    // Click delete button for first form
    await page.click('[data-testid="delete-form-button"]:first-child');
    
    // Should show confirmation modal
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should add validation rules to form elements', async ({ page }) => {
    await page.goto('/form-settings');
    
    await page.click('[data-testid="create-form-button"]');
    
    await page.fill('[data-testid="form-name-input"]', 'Validation Test Form');
    await page.fill('[data-testid="form-description-input"]', 'Testing validation rules');
    
    // Add a text input element
    await page.click('[data-testid="add-element-button"]');
    await page.fill('[data-testid="element-label"]', 'Serial Number');
    await page.selectOption('[data-testid="element-type"]', 'text');
    
    // Add validation rule
    await page.click('[data-testid="add-validation-button"]');
    
    await expect(page.locator('[data-testid="validation-modal"]')).toBeVisible();
    
    await page.selectOption('[data-testid="validation-type"]', 'required');
    await page.fill('[data-testid="validation-message"]', 'Serial number is required');
    
    await page.click('[data-testid="save-validation"]');
    
    await page.click('[data-testid="save-form-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 });
  });
});