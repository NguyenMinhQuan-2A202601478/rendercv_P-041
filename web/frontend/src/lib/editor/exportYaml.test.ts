import { describe, it, expect } from 'vitest';
import { buildRendercvYaml } from './exportYaml';
import type { CvDocuments } from '$lib/stores/documents';

function docs(overrides: Partial<CvDocuments> = {}): CvDocuments {
	return {
		cv: 'cv:\n  name: John Doe\n  sections: {}\n',
		design: 'design:\n  theme: classic\n',
		locale: 'locale:\n  language: en\n',
		settings: 'settings:\n  pdf_title: NAME - CV\n',
		...overrides
	};
}

describe('buildRendercvYaml', () => {
	it('joins the four documents in the order RenderCV expects', () => {
		const yaml = buildRendercvYaml(docs());

		expect(yaml).toBe(
			'cv:\n  name: John Doe\n  sections: {}\n' +
				'\n' +
				'design:\n  theme: classic\n' +
				'\n' +
				'locale:\n  language: en\n' +
				'\n' +
				'settings:\n  pdf_title: NAME - CV\n'
		);
	});

	it('leaves the user text alone rather than reformatting it', () => {
		// The point of concatenating rather than parsing and re-serialising:
		// comments and key order are the user's, and a round trip through a
		// YAML library would quietly rewrite both.
		const commented =
			'# my notes\ncv:\n  name: John Doe # trailing note\n  sections: {}\n';

		const yaml = buildRendercvYaml(docs({ cv: commented, design: '', locale: '', settings: '' }));

		expect(yaml).toContain('# my notes');
		expect(yaml).toContain('# trailing note');
	});

	it('drops empty documents instead of emitting bare keys', () => {
		// `design`, `locale` and `settings` are optional, and to RenderCV an
		// empty `design:` is not the same as an absent one.
		const yaml = buildRendercvYaml(docs({ design: '', locale: '   \n', settings: '' }));

		expect(yaml).toBe('cv:\n  name: John Doe\n  sections: {}\n');
	});

	it('ends with exactly one newline', () => {
		const yaml = buildRendercvYaml(docs());

		expect(yaml.endsWith('\n')).toBe(true);
		expect(yaml.endsWith('\n\n')).toBe(false);
	});

	it('returns the empty string when there is nothing to export', () => {
		const yaml = buildRendercvYaml(docs({ cv: '', design: '', locale: '', settings: '' }));

		expect(yaml).toBe('');
	});
});
