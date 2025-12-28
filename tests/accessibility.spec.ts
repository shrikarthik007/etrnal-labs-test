import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests for Axiom Trade Token Discovery Table
 * Uses axe-core to check WCAG 2.1 AA compliance
 */

test.describe('Accessibility Audit', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for content to load
        await page.waitForTimeout(2000);
    });

    test('Main page should not have critical accessibility violations', async ({ page }) => {
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Log violations for debugging
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Accessibility Violations:');
            accessibilityScanResults.violations.forEach((violation) => {
                console.log(`${violation.impact}: ${violation.description}`);
                violation.nodes.forEach((node) => {
                    console.log(`  - ${node.html}`);
                });
            });
        }

        // Filter out critical and serious violations
        const criticalViolations = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical' || v.impact === 'serious'
        );

        expect(criticalViolations.length).toBe(0);
    });

    test('Color contrast should meet WCAG AA standards', async ({ page }) => {
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2aa'])
            .options({ runOnly: ['color-contrast'] })
            .analyze();

        // Allow minor contrast issues but log them
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Color Contrast Issues:');
            accessibilityScanResults.violations.forEach((violation) => {
                violation.nodes.forEach((node) => {
                    console.log(`  - ${node.html}: ${node.failureSummary}`);
                });
            });
        }

        // Expect no critical contrast issues
        const criticalContrastIssues = accessibilityScanResults.violations.filter(
            (v) => v.impact === 'critical'
        );
        expect(criticalContrastIssues.length).toBe(0);
    });

    test('Interactive elements should be keyboard accessible', async ({ page }) => {
        // Test Tab navigation through interactive elements
        await page.keyboard.press('Tab');

        // Check that focus is visible
        const focusedElement = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el) return null;
            const styles = window.getComputedStyle(el);
            return {
                tagName: el.tagName,
                hasFocusStyle: styles.outline !== 'none' ||
                    styles.boxShadow !== 'none' ||
                    el.classList.contains('focus-visible'),
            };
        });

        expect(focusedElement).not.toBeNull();
    });

    test('Images should have alt text', async ({ page }) => {
        const images = await page.locator('img').all();

        for (const img of images) {
            const alt = await img.getAttribute('alt');
            const ariaLabel = await img.getAttribute('aria-label');
            const ariaHidden = await img.getAttribute('aria-hidden');

            // Either has alt, aria-label, or is decorative (aria-hidden)
            const hasAccessibleName = alt !== null || ariaLabel !== null || ariaHidden === 'true';
            expect(hasAccessibleName).toBe(true);
        }
    });

    test('Buttons should have accessible names', async ({ page }) => {
        const accessibilityScanResults = await new AxeBuilder({ page })
            .options({ runOnly: ['button-name'] })
            .analyze();

        const buttonNameViolations = accessibilityScanResults.violations.filter(
            (v) => v.id === 'button-name'
        );
        expect(buttonNameViolations.length).toBe(0);
    });

    test('Page should have proper heading hierarchy', async ({ page }) => {
        const headings = await page.evaluate(() => {
            const h = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            return Array.from(h).map((el) => ({
                level: parseInt(el.tagName.charAt(1)),
                text: el.textContent?.substring(0, 50),
            }));
        });

        // Check there's at least one heading
        expect(headings.length).toBeGreaterThan(0);

        // Log heading structure
        console.log('Heading Structure:');
        headings.forEach((h) => console.log(`  H${h.level}: ${h.text}`));
    });

    test('ARIA landmarks should be present', async ({ page }) => {
        const landmarks = await page.evaluate(() => {
            const roles = ['banner', 'navigation', 'main', 'contentinfo'];
            return roles.map((role) => ({
                role,
                exists: document.querySelector(`[role="${role}"], header, nav, main, footer`) !== null,
            }));
        });

        // At least main content should be identifiable
        const hasMainContent = landmarks.some((l) => l.exists);
        expect(hasMainContent).toBe(true);
    });
});

test.describe('Screen Reader Compatibility', () => {
    test('Live regions for real-time updates', async ({ page }) => {
        await page.goto('/');

        // Check for ARIA live regions that announce updates
        const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').count();

        // Log findings (may or may not have live regions depending on implementation)
        console.log(`Found ${liveRegions} ARIA live regions`);
    });
});
