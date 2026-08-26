import type { CvDocuments } from '$lib/stores/documents';
import { parseValidationErrors, type ValidationError } from '$lib/api/validate';
import { apiFetch } from '$lib/api/http';

export type { ValidationError } from '$lib/api/validate';

export type RenderResult =
	| { ok: true; blob: Blob }
	| { ok: false; errors: ValidationError[] };

/**
 * Posts the four CV documents to `/api/render` and returns either the PDF
 * bytes as a Blob, or the structured validation errors from a 422 response.
 *
 * Why: this is the one place that knows the request/response shape, so the
 * preview pane and its tests do not need to duplicate fetch/parsing logic.
 */
export async function renderPreview(
	docs: CvDocuments,
	fetchImpl: typeof fetch = apiFetch
): Promise<RenderResult> {
	const response = await fetchImpl('/api/render', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			cv_yaml: docs.cv,
			design_yaml: docs.design,
			locale_yaml: docs.locale,
			settings_yaml: docs.settings
		})
	});

	if (response.status === 200) {
		const blob = await response.blob();
		return { ok: true, blob };
	}

	if (response.status === 422) {
		const body = await response.json().catch(() => ({ errors: [] }));
		return { ok: false, errors: parseValidationErrors(body) };
	}

	const text = await response.text().catch(() => '');
	return {
		ok: false,
		errors: [
			{
				location: null,
				message: text || `Render failed with status ${response.status}`,
				yaml_source: 'main_yaml_file',
				yaml_line: null
			}
		]
	};
}

export { parseValidationErrors } from '$lib/api/validate';
