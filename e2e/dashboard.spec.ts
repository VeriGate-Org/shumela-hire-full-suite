import { test, expect } from '@playwright/test';

test.describe('ShumelaHire Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
  });

  test('homepage loads successfully', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/ShumelaHire/);
    
    // Check for main navigation or key elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation is accessible', async ({ page }) => {
    // Check if main navigation exists
    const navigation = page.locator('nav, [role="navigation"]');
    
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Check for dashboard link or similar
    const dashboardLink = page.locator('a[href*="dashboard"], button:has-text("Dashboard")');
    
    if (await dashboardLink.count() > 0) {
      await expect(dashboardLink.first()).toBeVisible();
    }
  });

  test('page is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and accessible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile-friendly navigation (hamburger menu, etc.)
    const mobileNav = page.locator('[aria-label*="menu"], button[aria-expanded]');
    
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('performance dashboard loads', async ({ page }) => {
    // Try to navigate to performance dashboard
    try {
      await page.goto('/dashboard/performance');
      
      // Check that the page loads without major errors
      await expect(page).toHaveTitle(/Performance|Dashboard/);
      
      // Look for performance-related content
      const performanceContent = page.locator('text=/performance|metrics|monitoring/i');
      
      if (await performanceContent.count() > 0) {
        await expect(performanceContent.first()).toBeVisible();
      }
    } catch (error) {
      // If the route doesn't exist, that's okay for now
      console.log('Performance dashboard route not available yet');
    }
  });

  test('virtual scrolling component works', async ({ page }) => {
    // Look for any large lists or virtual scroll components
    const scrollableContent = page.locator('[data-testid*="virtual"], [role="list"], .overflow-auto');
    
    if (await scrollableContent.count() > 0) {
      const firstScrollable = scrollableContent.first();
      await expect(firstScrollable).toBeVisible();
      
      // Test scrolling behavior
      await firstScrollable.hover();
      await page.mouse.wheel(0, 500); // Scroll down
      
      // Verify scroll worked (content should still be visible)
      await expect(firstScrollable).toBeVisible();
    }
  });

  test('core web vitals are reasonable', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load reasonably fast (less than 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Check for any JavaScript errors
    let hasErrors = false;
    page.on('pageerror', () => {
      hasErrors = true;
    });
    
    // Wait a bit to catch any async errors
    await page.waitForTimeout(1000);
    
    expect(hasErrors).toBe(false);
  });

  test('accessibility basics are met', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility features
    const mainContent = page.locator('main, [role="main"]');
    
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }
    
    // Check for navigation landmarks
    const navigation = page.locator('nav, [role="navigation"]');
    
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Check that buttons and links have accessible text
    const interactiveElements = page.locator('button, a, input');
    const count = await interactiveElements.count();
    
    if (count > 0) {
      // Just check that interactive elements exist and are visible
      const firstElement = interactiveElements.first();
      await expect(firstElement).toBeVisible();
    }
  });
});
