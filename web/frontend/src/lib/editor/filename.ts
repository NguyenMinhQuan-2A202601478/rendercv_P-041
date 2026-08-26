import type { CvDocuments } from '$lib/stores/documents';

/**
 * Extracts a simple top-level `key: value` scalar from a small YAML document
 * using a line scan rather than a full parser.
 *
 * Why not a real YAML parser here: this only ever reads two well-known,
 * unnested scalar fields (`cv.name`, `settings.pdf_title`) for a filename
 * hint; a full parse for that is unjustified weight on every keystroke, and
 * the backend remains the source of truth for actual validation.
 */
function extractScalar(yamlText: string, key: string): string | null {
	const pattern = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, 'm');
	const match = pattern.exec(yamlText);
	if (!match) return null;

	let value = match[1];
	// Strip a trailing YAML comment (naively; good enough for a plain scalar).
	if (!/^['"]/.test(value)) {
		const hashIndex = value.indexOf(' #');
		if (hashIndex !== -1) value = value.slice(0, hashIndex).trimEnd();
	}
	// Strip matching quotes.
	const quoted = /^(['"])(.*)\1$/.exec(value);
	if (quoted) value = quoted[2];

	return value.length > 0 ? value : null;
}

/** Removes characters that are unsafe in a downloaded file name. */
function sanitizeFilename(name: string): string {
	return name.replace(/[\\/:*?"<>|]+/g, '').trim();
}

/**
 * Derives the PDF download filename from the settings document's
 * `pdf_title`, substituting `NAME` with the CV's name when present, and
 * falling back to `cv.pdf` when `pdf_title` is absent or unparsable.
 */
export function derivePdfFilename(docs: CvDocuments): string {
	const pdfTitle = extractScalar(docs.settings, 'pdf_title');
	if (!pdfTitle) return 'cv.pdf';

	const name = extractScalar(docs.cv, 'name');
	const substituted = name ? pdfTitle.replaceAll('NAME', name) : pdfTitle;
	const sanitized = sanitizeFilename(substituted);
	if (!sanitized) return 'cv.pdf';

	return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
}
