import { test, expect } from '@playwright/test';

test.describe('Sanity Check', () => {
  test('should load login page', async ({ page }) => {
    // Navigate to the root URL (configured in playwright.config.ts)
    // Assuming /login or / is the entry point
    await page.goto('/');

    // Check if the page title is correct or if basic elements exist
    // This is a minimal check to verify the browser can connect to the app
    await expect(page).toHaveTitle(/.*Constructions|.*Login|.*Scrum|FieldClose/i);

    // Also check for a basic login form element if possible
    // await expect(page.locator('form')).toBeVisible();
  });
});
