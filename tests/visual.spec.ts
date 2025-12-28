import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Axiom Trade Token Discovery Table
 * These tests capture screenshots and compare them against baseline images
 */

test.describe('Visual Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Wait for the page to fully load with data
        await page.goto('/');
        // Wait for tokens to load (checking for token rows)
        await page.waitForSelector('[data-testid="token-row"]', { timeout: 10000 }).catch(() => {
            // If no test ID, wait for the grid layout
            return page.waitForSelector('.grid', { timeout: 10000 });
        });
        // Additional wait for animations to settle
        await page.waitForTimeout(1000);
    });

    test('Main page layout - Desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await expect(page).toHaveScreenshot('main-page-desktop.png', {
            fullPage: true,
            maxDiffPixels: 100,
        });
    });

    test('Main page layout - Tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page).toHaveScreenshot('main-page-tablet.png', {
            fullPage: true,
            maxDiffPixels: 100,
        });
    });

    test('Main page layout - Mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await expect(page).toHaveScreenshot('main-page-mobile.png', {
            fullPage: true,
            maxDiffPixels: 100,
        });
    });

    test('Header component', async ({ page }) => {
        const header = page.locator('header').first();
        await expect(header).toHaveScreenshot('header-component.png', {
            maxDiffPixels: 50,
        });
    });

    test('Token column appearance', async ({ page }) => {
        // Capture screenshots of each token column
        const columns = page.locator('[class*="token-column"], .flex.flex-col.gap-2, [class*="TokenColumn"]');
        const count = await columns.count();

        for (let i = 0; i < Math.min(count, 3); i++) {
            await expect(columns.nth(i)).toHaveScreenshot(`token-column-${i}.png`, {
                maxDiffPixels: 100,
            });
        }
    });

    test('Token row hover state', async ({ page }) => {
        const firstRow = page.locator('[data-testid="token-row"], [class*="token-row"], tr').first();

        // Capture normal state
        await expect(firstRow).toHaveScreenshot('token-row-normal.png', {
            maxDiffPixels: 50,
        });

        // Hover and capture hover state
        await firstRow.hover();
        await page.waitForTimeout(300); // Wait for hover animation
        await expect(firstRow).toHaveScreenshot('token-row-hover.png', {
            maxDiffPixels: 50,
        });
    });
});

test.describe('Cross-browser Visual Consistency', () => {
    test('Page renders consistently across browsers', async ({ page, browserName }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot(`cross-browser-${browserName}.png`, {
            fullPage: true,
            maxDiffPixels: 150, // Slightly higher tolerance for cross-browser
        });
    });
});

test.describe('Responsive Design Tests', () => {
    const viewports = [
        { name: 'small-mobile', width: 320, height: 568 },
        { name: 'mobile', width: 375, height: 812 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'laptop', width: 1366, height: 768 },
        { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
        test(`Layout at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto('/');
            await page.waitForTimeout(1500);

            await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, {
                fullPage: true,
                maxDiffPixels: 100,
            });
        });
    }
});
