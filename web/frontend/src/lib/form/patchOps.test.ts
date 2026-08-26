import { describe, it, expect } from 'vitest';
import { applyOp, collapseOps, getAtPath, pathKey, type PatchOp } from './patchOps';

function sampleTree() {
	return {
		cv: {
			name: 'John Doe',
			sections: {
				Education: [
					{ institution: 'MIT', area: 'CS', highlights: ['Did a thing'] },
					{ institution: 'Boğaziçi', area: 'EE' }
				]
			}
		}
	};
}

describe('applyOp: set', () => {
	it('replaces a scalar field without touching sibling fields', () => {
		const tree = sampleTree();
		const next = applyOp(tree, { op: 'set', path: ['cv', 'name'], value: 'Jane Doe' });
		expect(getAtPath(next, ['cv', 'name'])).toBe('Jane Doe');
		expect(getAtPath(next, ['cv', 'sections', 'Education', 0, 'institution'])).toBe('MIT');
		// original tree is untouched (pure function)
		expect(tree.cv.name).toBe('John Doe');
	});

	it('sets a deeply nested entry field', () => {
		const tree = sampleTree();
		const next = applyOp(tree, {
			op: 'set',
			path: ['cv', 'sections', 'Education', 0, 'degree'],
			value: 'BS'
		});
		expect(getAtPath(next, ['cv', 'sections', 'Education', 0, 'degree'])).toBe('BS');
	});

	it('creates a missing key (adding a brand new section)', () => {
		const tree = sampleTree();
		const next = applyOp(tree, { op: 'set', path: ['cv', 'sections', 'Experience'], value: [] });
		expect(getAtPath(next, ['cv', 'sections', 'Experience'])).toEqual([]);
		expect(getAtPath(next, ['cv', 'sections', 'Education'])).toHaveLength(2); // untouched
	});

	it('sets a highlight string inside an entry', () => {
		const tree = sampleTree();
		const next = applyOp(tree, {
			op: 'set',
			path: ['cv', 'sections', 'Education', 0, 'highlights', 0],
			value: 'Edited highlight'
		});
		expect(getAtPath(next, ['cv', 'sections', 'Education', 0, 'highlights', 0])).toBe(
			'Edited highlight'
		);
	});
});

describe('applyOp: insert', () => {
	it('inserts a new entry at the given index', () => {
		const tree = sampleTree();
		const next = applyOp(tree, {
			op: 'insert',
			path: ['cv', 'sections', 'Education'],
			index: 2,
			value: { institution: 'New Uni', area: 'Physics' }
		});
		const education = getAtPath(next, ['cv', 'sections', 'Education']) as unknown[];
		expect(education).toHaveLength(3);
		expect(education[2]).toEqual({ institution: 'New Uni', area: 'Physics' });
	});

	it('inserts a new highlight', () => {
		const tree = sampleTree();
		const next = applyOp(tree, {
			op: 'insert',
			path: ['cv', 'sections', 'Education', 0, 'highlights'],
			index: 1,
			value: 'Second highlight'
		});
		expect(getAtPath(next, ['cv', 'sections', 'Education', 0, 'highlights'])).toEqual([
			'Did a thing',
			'Second highlight'
		]);
	});
});

describe('applyOp: delete', () => {
	it('deletes an entry by index, shifting later ones down', () => {
		const tree = sampleTree();
		const next = applyOp(tree, { op: 'delete', path: ['cv', 'sections', 'Education', 0] });
		const education = getAtPath(next, ['cv', 'sections', 'Education']) as unknown[];
		expect(education).toHaveLength(1);
		expect((education[0] as { institution: string }).institution).toBe('Boğaziçi');
	});

	it('deletes a whole section (mapping key)', () => {
		const tree = sampleTree();
		const next = applyOp(tree, { op: 'delete', path: ['cv', 'sections', 'Education'] });
		expect(getAtPath(next, ['cv', 'sections', 'Education'])).toBeUndefined();
	});
});

describe('applyOp: move', () => {
	it('reorders entries within a section', () => {
		const tree = sampleTree();
		const next = applyOp(tree, {
			op: 'move',
			path: ['cv', 'sections', 'Education'],
			from_index: 0,
			to_index: 1
		});
		const education = getAtPath(next, ['cv', 'sections', 'Education']) as { institution: string }[];
		expect(education.map((e) => e.institution)).toEqual(['Boğaziçi', 'MIT']);
	});
});

describe('collapseOps', () => {
	it('keeps only the last set to the same path, preserving other ops in order', () => {
		const ops: PatchOp[] = [
			{ op: 'set', path: ['cv', 'name'], value: 'J' },
			{ op: 'set', path: ['cv', 'name'], value: 'Jo' },
			{ op: 'set', path: ['cv', 'name'], value: 'John' },
			{ op: 'insert', path: ['cv', 'sections', 'Education'], index: 0, value: {} },
			{ op: 'set', path: ['cv', 'headline'], value: 'Engineer' }
		];
		expect(collapseOps(ops)).toEqual([
			{ op: 'set', path: ['cv', 'name'], value: 'John' },
			{ op: 'insert', path: ['cv', 'sections', 'Education'], index: 0, value: {} },
			{ op: 'set', path: ['cv', 'headline'], value: 'Engineer' }
		]);
	});

	it('does not collapse sets to different paths', () => {
		const ops: PatchOp[] = [
			{ op: 'set', path: ['cv', 'name'], value: 'John' },
			{ op: 'set', path: ['cv', 'headline'], value: 'Engineer' }
		];
		expect(collapseOps(ops)).toEqual(ops);
	});
});

describe('pathKey', () => {
	it('joins a path into the API location dotted-string format', () => {
		expect(pathKey(['cv', 'sections', 'Education', 0, 'degree'])).toBe('cv.sections.Education.0.degree');
	});
});
