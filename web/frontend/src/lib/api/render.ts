import type { CvDocuments } from '$lib/stores/documents';

/** A single structured validation error, as returned by `POST /api/validate`. */
export interface ValidationError {
	location: string;
	message: string;
	yaml_line: number | null;
}

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
	fetchImpl: typeof fetch = fetch
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
				location: 'request',
				message: text || `Render failed with status ${response.status}`,
				yaml_line: null
			}
		]
	};
}

/** Normalizes the `{errors: [...]}` 422 payload into ValidationError[]. */
export function parseValidationErrors(body: unknown): ValidationError[] {
	if (
		typeof body !== 'object' ||
		body === null ||
		!('errors' in body) ||
		!Array.isArray((body as { errors: unknown }).errors)
	) {
		return [];
	}

	return (body as { errors: unknown[] }).errors.map((raw) => {
		const entry = (raw ?? {}) as Record<string, unknown>;
		return {
			location: typeof entry.location === 'string' ? entry.location : 'unknown',
			message: typeof entry.message === 'string' ? entry.message : 'Invalid value.',
			yaml_line: typeof entry.yaml_line === 'number' ? entry.yaml_line : null
		};
	});
}
