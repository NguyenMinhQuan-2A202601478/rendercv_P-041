import { test, expect } from './fixtures';

/**
 * Phase 5c: the static landing page, served at `/` since Phase 6
 * moved the editor to `/app`.
 *
 * Why this spec is still backend-independent (unlike every other
 * `e2e/*.spec.ts` file, which calls `gotoReady`/`firstPreviewUrl` and
 * depends on `/api/cvs`+`/api/render` being reachable): the landing page
 * has no store, no schema-driven form and no preview, and must render
 * completely even with the backend down.
 *
 * Phase 6 narrowed that from "makes no `/api` request at all" to "makes no
 * request it needs an answer to". It asks `/api/auth/me` one thing -- may I
 * offer sign-in? -- and renders everything else regardless of the answer.
 * The property is therefore asserted the stronger way now: the API is
 * blocked outright and the page is still expected to come up whole.
 */

test.describe('Landing page (/)', () => {
	test('asks the backend nothing except whether sign-in is available', async ({ page }) => {
		const apiRequests: string[] = [];
		page.on('request', (request) => {
			const { pathname } = new URL(request.url());
			if (pathname.startsWith('/api')) apiRequests.push(pathname);
		});

		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('YAML-first resume builder');

		// Polled rather than sampled once: the status request is fired from
		// `onMount` and deliberately not awaited by anything that renders, so
		// the heading is on screen before it has even left. No bootstrap, no
		// render, no schema -- the editor's machinery must stay out of the
		// landing page.
		await expect.poll(() => [...new Set(apiRequests)]).toEqual(['/api/auth/me']);
	});

	test('renders completely with the API unreachable', async ({ page }) => {
		// The real property behind the request assertion above: nothing on
		// this page waits on the backend. With /api dead the page must still
		// come up whole -- just without a sign-in link that could not work.
		await page.route('**/api/**', (route) => route.abort());

		await page.goto('/');

		await expect(page.getByRole('heading', { level: 1 })).toContainText('YAML-first resume builder');
		await expect(page.getByRole('link', { name: 'Open the editor' }).first()).toBeVisible();
		await expect(page.getByRole('list', { name: 'Key features' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
	});

	test('hero, feature bullets, and CTAs are visible', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('link', { name: 'RenderCV home' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Open the editor' }).first()).toHaveAttribute('href', '/app');

		const features = page.getByRole('list', { name: 'Key features' });
		await expect(features.getByText('Industry-standard themes')).toBeVisible();
		await expect(features.getByText('Form editor or YAML')).toBeVisible();
		await expect(features.getByText('Live PDF preview')).toBeVisible();
		await expect(features.getByText('Multilanguage support')).toBeVisible();
		await expect(features.getByText('Your data stays on this server')).toBeVisible();

		await expect(page.getByRole('img', { name: /five CV theme layouts/ })).toBeVisible();
	});

	test('the hero showcase renders real CV images, not empty cards', async ({ page }) => {
		// The assertion above passes even with every image broken: the
		// showcase's accessible name lives on a wrapping div, so a 404 on all
		// five files leaves it "visible" and empty. That is exactly how this
		// shipped -- five blank cards that read as a failed load. Decoding
		// each image is what actually proves the files are there and served.
		await page.goto('/');

		const images = page.locator('[aria-label*="five CV theme layouts"] img');
		await expect(images).toHaveCount(5);

		for (let i = 0; i < 5; i += 1) {
			const decoded = await images.nth(i).evaluate((node) => {
				const image = node as HTMLImageElement;
				return image.complete && image.naturalWidth > 0;
			});
			expect(decoded, `theme image ${i} did not decode`).toBe(true);
		}
	});

	test('9-theme strip lists all built-in themes', async ({ page }) => {
		await page.goto('/');

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
		await page.goto('/');

		const question = page.getByText('Is my data private?');
		const details = page.locator('details', { has: question });

		await expect(details).not.toHaveAttribute('open', '');
		await question.click();
		await expect(details).toHaveAttribute('open', '');
		await expect(details.getByText(/not sent to any third-party service/)).toBeVisible();

		await question.click();
		await expect(details).not.toHaveAttribute('open', '');
	});

	test('footer CTA links to the editor and credits upstream RenderCV', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('heading', { name: 'Ready to build your CV?' })).toBeVisible();
		const github = page.getByRole('link', { name: 'Powered by RenderCV (open source)' });
		await expect(github).toHaveAttribute('href', 'https://github.com/rendercv/rendercv');
		await expect(github).toHaveAttribute('target', '_blank');
	});

	test('the old /welcome address permanently redirects to the landing page', async ({ page }) => {
		// Phase 6 moved the landing page from /welcome to /. Bookmarks and
		// links shared while it lived at /welcome must keep working rather
		// than 404, so that address is kept as a permanent redirect.
		const response = await page.goto('/welcome');

		expect(new URL(page.url()).pathname).toBe('/');
		await expect(page.getByRole('heading', { level: 1 })).toContainText(
			'YAML-first resume builder'
		);
		expect(response?.status()).toBe(200); // followed the redirect to a real page
	});
});

// Note: the Sidebar "About" link (added to `Sidebar.svelte`'s footer area)
// is intentionally NOT covered here. `Sidebar` only mounts after the editor's
// `/api` bootstrap completes, and this spec is deliberately backend-free (see
// the file-level comment) so it can run standalone alongside a concurrently
// edited `EditorPane`/`PreviewPane`. It was verified manually instead: see
// the phase report.
