import type { CvDocuments } from '$lib/stores/documents';

/** Which of the four YAML documents a validation error came from. */
export type YamlSource = 'main_yaml_file' | 'design_yaml_file' | 'locale_yaml_file' | 'settings_yaml_file';

/** A single structured validation error, as returned by the API on a 422. */
export interface ValidationError {
	location: string | null;
	message: string;
	yaml_source: YamlSource;
	yaml_line: number | null;
}

export type ValidateResult = { ok: true } | { ok: false; errors: ValidationError[] };

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
		const yamlSource: YamlSource =
			entry.yaml_source === 'design_yaml_file' ||
			entry.yaml_source === 'locale_yaml_file' ||
			entry.yaml_source === 'settings_yaml_file'
				? entry.yaml_source
				: 'main_yaml_file';
		return {
			location: typeof entry.location === 'string' ? entry.location : 'unknown',
			message: typeof entry.message === 'string' ? entry.message : 'Invalid value.',
			yaml_source: yamlSource,
			yaml_line: typeof entry.yaml_line === 'number' ? entry.yaml_line : null
		};
	});
}

/**
 * Posts the four CV documents to `/api/validate` and returns either
 * confirmation the documents are valid, or the structured validation
 * errors from a 422 response.
 *
 * Why a separate call from `/api/render`: this runs on the same debounce
 * as the preview render but is the authoritative source for inline error
 * placement (line/tab), independent of whether a render is also possible
 * (e.g. a document can be schema-valid but still fail to render as a PDF).
 */
export async function validateDocuments(
	docs: CvDocuments,
	fetchImpl: typeof fetch = fetch
): Promise<ValidateResult> {
	const response = await fetchImpl('/api/validate', {
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
		return { ok: true };
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
				message: text || `Validation failed with status ${response.status}`,
				yaml_source: 'main_yaml_file',
				yaml_line: null
			}
		]
	};
}
