import { writable } from 'svelte/store';

/** The four YAML documents that make up a single CV, as raw text. */
export type DocumentKey = 'cv' | 'design' | 'locale' | 'settings';

export const DOCUMENT_KEYS: DocumentKey[] = ['cv', 'design', 'locale', 'settings'];

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
	cv: 'CV',
	design: 'Design',
	locale: 'Locale',
	settings: 'Settings'
};

export interface CvDocuments {
	cv: string;
	design: string;
	locale: string;
	settings: string;
}

/**
 * The default content each document starts with for a new CV.
 *
 * Why: matches the reference editor's placeholder CV so a fresh session has
 * something renderable immediately.
 */
export function createDefaultDocuments(): CvDocuments {
	return {
		cv: 'cv:\n  name: John Doe\n  sections: {}\n',
		design: '',
		locale: '',
		settings: 'settings:\n  pdf_title: NAME - CV\n'
	};
}

/**
 * The single source of truth for the four CV documents.
 *
 * Why: the form editor (later phases) and the YAML editor are two views of
 * this same store — never two copies that can diverge.
 */
export const documents = writable<CvDocuments>(createDefaultDocuments());

/** Replaces the text of a single document, leaving the others untouched. */
export function setDocument(key: DocumentKey, value: string): void {
	documents.update((docs) => ({ ...docs, [key]: value }));
}

/** Resets all four documents back to their defaults. */
export function resetDocuments(): void {
	documents.set(createDefaultDocuments());
}
