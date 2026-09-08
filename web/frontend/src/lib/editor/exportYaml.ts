import { DOCUMENT_KEYS, type CvDocuments } from '$lib/stores/documents';

/**
 * Joins the editor's four documents into a single RenderCV input file.
 *
 * Why concatenation is the whole implementation: each document already
 * carries its own top-level key (`cv:`, `design:`, `locale:`, `settings:`),
 * so putting them one after another produces exactly the shape RenderCV's
 * own CLI reads -- `rendercv render <file>.yaml` accepts the result without
 * any further step. Anything cleverer (parse, merge, re-serialise) would
 * reformat the user's YAML, losing their comments and key order, to produce
 * a file that is no more valid.
 *
 * Empty documents are dropped rather than emitted as bare keys: `design`,
 * `locale` and `settings` are all optional, and an empty `design:` is not
 * the same thing to RenderCV as an absent one.
 *
 * @param docs The editor's four documents.
 * @returns One YAML file, or the empty string when every document is empty.
 */
export function buildRendercvYaml(docs: CvDocuments): string {
	const blocks = DOCUMENT_KEYS.map((key) => docs[key].trim()).filter(
		(block) => block.length > 0
	);
	if (blocks.length === 0) return '';
	// A blank line between blocks, and a trailing newline: this is a text
	// file people will open in an editor, not only feed to a parser.
	return `${blocks.join('\n\n')}\n`;
}
