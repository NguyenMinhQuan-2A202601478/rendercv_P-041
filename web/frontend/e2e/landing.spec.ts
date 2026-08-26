import { test, expect } from '@playwright/test';

/**
 * Phase 5c: the static `/welcome` landing page.
 *
 * Why this spec never touches the backend (unlike every other `e2e/*.spec.ts`
 * file, which calls `gotoReady`/`firstPreviewUrl` and depends on
 * `/api/cvs`+`/api/render` being reachable): the landing page is a
 * self-contained marketing page with no store, no schema-driven form, and no
 * preview -- it must render fully offline. This test asserts exactly that by
 * failing if any `/api/*` request is observed, instead of waiting on one.
 */

test.describe('Landing page (/welcome)', () => {
	test('renders with no /api requests', async ({ page }) => {
		const apiRequests: string[] = [];
		page.on('request', (request) => {
			if (new URL(request.url()).pathname.startsWith('/api')) {
				apiRequests.push(request.url());
			}
		});

		await page.goto('/welcome');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('YAML-first resume builder');

		expect(apiRequests).toEqual([]);
	});

	test('hero, feature bullets, and CTAs are visible', async ({ page }) => {
		await page.goto('/welcome');

		await expect(page.getByRole('link', { name: 'RenderCV home' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Open the editor' }).first()).toHaveAttribute('href', '/');

		const features = page.getByRole('list', { name: 'Key features' });
		await expect(features.getByText('Industry-standard themes')).toBeVisible();
		await expect(features.getByText('Form editor or YAML')).toBeVisible();
		await expect(features.getByText('Live PDF preview')).toBeVisible();
		await expect(features.getByText('Multilanguage support')).toBeVisible();
		await expect(features.getByText('Your data stays local')).toBeVisible();

		await expect(page.getByRole('img', { name: /five CV theme layouts/ })).toBeVisible();
	});

	test('9-theme strip lists all built-in themes', async ({ page }) => {
		await page.goto('/welcome');

		const strip = page.getByRole('region', { name: '9 built-in themes' });
		const themes = [
			'Classic',
			'Sb2nov',
			'Moderncv',
			'Engineering Resumes',
			'Engineering Classic',
			'Harvard',
			'Ink',
			'Opal',
			'Ember'
		];
		for (const theme of themes) {
			await expect(strip.getByText(theme, { exact: true })).toBeVisible();
		}
	});

	test('FAQ accordion opens and closes with native <details>', async ({ page }) => {
		await page.goto('/welcome');

		const question = page.getByText('Is my data private?');
		const details = page.locator('details', { has: question });

		await expect(details).not.toHaveAttribute('open', '');
		await question.click();
		await expect(details).toHaveAttribute('open', '');
		await expect(details.getByText(/anonymous device session/)).toBeVisible();

		await question.click();
		await expect(details).not.toHaveAttribute('open', '');
	});

	test('footer CTA links to the editor and credits upstream RenderCV', async ({ page }) => {
		await page.goto('/welcome');

		await expect(page.getByRole('heading', { name: 'Ready to build your CV?' })).toBeVisible();
		const github = page.getByRole('link', { name: 'Powered by RenderCV (open source)' });
		await expect(github).toHaveAttribute('href', 'https://github.com/rendercv/rendercv');
		await expect(github).toHaveAttribute('target', '_blank');
	});
});

// Note: the Sidebar "About" link (added to `Sidebar.svelte`'s footer area)
// is intentionally NOT covered here. `Sidebar` only mounts after the editor's
// `/api` bootstrap completes, and this spec is deliberately backend-free (see
// the file-level comment) so it can run standalone alongside a concurrently
// edited `EditorPane`/`PreviewPane`. It was verified manually instead: see
// the phase report.
