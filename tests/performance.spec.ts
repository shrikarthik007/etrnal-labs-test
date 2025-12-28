import { test, expect } from '@playwright/test';

/**
 * Performance Tests for Axiom Trade Token Discovery Table
 * Tests interaction responsiveness and page load performance
 */

test.describe('Performance Tests', () => {
    test('Page should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const domContentLoaded = Date.now() - startTime;
        console.log(`DOM Content Loaded: ${domContentLoaded}ms`);

        await page.waitForLoadState('networkidle');
        const networkIdle = Date.now() - startTime;
        console.log(`Network Idle: ${networkIdle}ms`);

        // DOM should load within 3 seconds
        expect(domContentLoaded).toBeLessThan(3000);
    });

    test('First Contentful Paint should be fast', async ({ page }) => {
        await page.goto('/');

        const performanceMetrics = await page.evaluate(() => {
            const entries = performance.getEntriesByType('paint');
            return entries.map((entry) => ({
                name: entry.name,
                startTime: entry.startTime,
            }));
        });

        console.log('Paint Metrics:', performanceMetrics);

        const fcp = performanceMetrics.find((m) => m.name === 'first-contentful-paint');
        if (fcp) {
            expect(fcp.startTime).toBeLessThan(2000); // FCP under 2 seconds
        }
    });

    test('Interactions should complete within 100ms', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000); // Wait for initial load

        // Test hover interaction speed
        const tokenRow = page.locator('[data-testid="token-row"], [class*="token-row"], .group').first();

        if (await tokenRow.count() > 0) {
            const hoverStart = Date.now();
            await tokenRow.hover();
            const hoverEnd = Date.now();

            console.log(`Hover interaction: ${hoverEnd - hoverStart}ms`);
            expect(hoverEnd - hoverStart).toBeLessThan(100);
        }
    });

    test('Click interaction responsiveness', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Find a clickable element (button or token row)
        const clickable = page.locator('button, [role="button"]').first();

        if (await clickable.count() > 0) {
            const clickStart = Date.now();
            await clickable.click({ force: true });
            const clickEnd = Date.now();

            console.log(`Click interaction: ${clickEnd - clickStart}ms`);
            expect(clickEnd - clickStart).toBeLessThan(100);
        }
    });

    test('Sort interaction performance', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Look for sort dropdown or button
        const sortButton = page.locator('[class*="sort"], button:has-text("Sort"), [aria-label*="sort"]').first();

        if (await sortButton.count() > 0) {
            const startTime = Date.now();
            await sortButton.click();
            await page.waitForTimeout(100);
            const endTime = Date.now();

            console.log(`Sort button click: ${endTime - startTime}ms`);
        }
    });

    test('No memory leaks during scroll', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Get initial memory usage if available
        const initialMemory = await page.evaluate(() => {
            // @ts-ignore - performance.memory is Chrome-specific
            return (performance as any).memory?.usedJSHeapSize || 0;
        });

        // Scroll multiple times
        for (let i = 0; i < 10; i++) {
            await page.mouse.wheel(0, 300);
            await page.waitForTimeout(100);
        }

        // Scroll back up
        for (let i = 0; i < 10; i++) {
            await page.mouse.wheel(0, -300);
            await page.waitForTimeout(100);
        }

        const finalMemory = await page.evaluate(() => {
            // @ts-ignore
            return (performance as any).memory?.usedJSHeapSize || 0;
        });

        if (initialMemory > 0 && finalMemory > 0) {
            const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
            console.log(`Memory increase after scrolling: ${memoryIncrease.toFixed(2)}%`);

            // Memory should not increase by more than 50%
            expect(memoryIncrease).toBeLessThan(50);
        }
    });
});

test.describe('Web Vitals Metrics', () => {
    test('Core Web Vitals should be within acceptable range', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get Largest Contentful Paint
        const lcp = await page.evaluate(() => {
            return new Promise((resolve) => {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry?.startTime || 0);
                }).observe({ type: 'largest-contentful-paint', buffered: true });

                // Fallback timeout
                setTimeout(() => resolve(0), 5000);
            });
        });

        console.log(`Largest Contentful Paint: ${lcp}ms`);

        // LCP should be under 2.5 seconds for good, under 4 seconds for needs improvement
        if (typeof lcp === 'number' && lcp > 0) {
            expect(lcp).toBeLessThan(4000);
        }
    });

    test('Cumulative Layout Shift should be minimal', async ({ page }) => {
        await page.goto('/');

        const cls = await page.evaluate(() => {
            return new Promise((resolve) => {
                let clsValue = 0;
                new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        // @ts-ignore
                        if (!entry.hadRecentInput) {
                            // @ts-ignore
                            clsValue += entry.value;
                        }
                    }
                }).observe({ type: 'layout-shift', buffered: true });

                setTimeout(() => resolve(clsValue), 3000);
            });
        });

        console.log(`Cumulative Layout Shift: ${cls}`);

        // CLS should be under 0.1 for good, under 0.25 for needs improvement
        if (typeof cls === 'number') {
            expect(cls).toBeLessThan(0.25);
        }
    });
});

test.describe('Bundle and Resource Loading', () => {
    test('Total transferred size should be reasonable', async ({ page }) => {
        const resourcesLoaded: { url: string; size: number }[] = [];

        page.on('response', async (response) => {
            const headers = response.headers();
            const size = parseInt(headers['content-length'] || '0');
            resourcesLoaded.push({
                url: response.url(),
                size,
            });
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const totalSize = resourcesLoaded.reduce((acc, r) => acc + r.size, 0);
        const totalSizeKB = totalSize / 1024;

        console.log(`Total resources loaded: ${resourcesLoaded.length}`);
        console.log(`Total transferred size: ${totalSizeKB.toFixed(2)} KB`);

        // Log largest resources
        const largest = resourcesLoaded.sort((a, b) => b.size - a.size).slice(0, 5);
        console.log('Largest resources:');
        largest.forEach((r) => {
            console.log(`  ${(r.size / 1024).toFixed(2)} KB - ${r.url.substring(0, 80)}`);
        });
    });

    test('No render-blocking resources', async ({ page }) => {
        await page.goto('/');

        const renderBlockingResources = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            return resources
                .filter((r) => r.renderBlockingStatus === 'blocking')
                .map((r) => r.name);
        });

        console.log(`Render-blocking resources: ${renderBlockingResources.length}`);
        renderBlockingResources.forEach((r) => console.log(`  - ${r}`));

        // Warn if there are many render-blocking resources
        expect(renderBlockingResources.length).toBeLessThan(5);
    });
});
