import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, writable } from 'svelte/store';
import { createRenderController } from './renderController';
import type { CvDocuments } from '$lib/stores/documents';
import type { RenderResult } from '$lib/api/render';

function docs(cv = 'cv:\n  name: John Doe\n'): CvDocuments {
	return { cv, design: '', locale: '', settings: '' };
}

describe('createRenderController', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('debounces: a burst of document changes triggers exactly one render', async () => {
		const source = writable<CvDocuments>(docs());
		const render = vi.fn(
			async (): Promise<RenderResult> => ({ ok: true, blob: new Blob(['pdf']) })
		);
		let urlCounter = 0;
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => `blob:${++urlCounter}`,
			revokeObjectURL: () => {}
		});

		// Rapid edits within the debounce window.
		source.set(docs('cv:\n  name: A\n'));
		vi.advanceTimersByTime(300);
		source.set(docs('cv:\n  name: AB\n'));
		vi.advanceTimersByTime(300);
		source.set(docs('cv:\n  name: ABC\n'));

		// Still inside the debounce window from the last change.
		vi.advanceTimersByTime(799);
		expect(render).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));

		expect(render).toHaveBeenCalledWith(docs('cv:\n  name: ABC\n'));
		controller.destroy();
	});

	it('shows a pending status before the first successful render, then the blob URL', async () => {
		const source = writable<CvDocuments>(docs());
		let resolveRender: (result: RenderResult) => void = () => {};
		const render = vi.fn(
			() =>
				new Promise<RenderResult>((resolve) => {
					resolveRender = resolve;
				})
		);
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => 'blob:first',
			revokeObjectURL: () => {}
		});

		vi.advanceTimersByTime(800);
		expect(get(controller.state).status).toBe('pending');
		expect(get(controller.state).hasRenderedOnce).toBe(false);

		resolveRender({ ok: true, blob: new Blob(['pdf']) });
		await vi.waitFor(() => expect(get(controller.state).status).toBe('success'));

		expect(get(controller.state).url).toBe('blob:first');
		expect(get(controller.state).hasRenderedOnce).toBe(true);
		controller.destroy();
	});

	it('keeps the last good preview visible when a later render is invalid', async () => {
		const source = writable<CvDocuments>(docs());
		const render = vi
			.fn<() => Promise<RenderResult>>()
			.mockResolvedValueOnce({ ok: true, blob: new Blob(['pdf']) })
			.mockResolvedValueOnce({
				ok: false,
				errors: [
					{
						location: 'cv.name',
						message: 'Field required',
						yaml_source: 'main_yaml_file',
						yaml_line: 2
					}
				]
			});
		const revokeObjectURL = vi.fn();
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => 'blob:good',
			revokeObjectURL
		});

		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(get(controller.state).status).toBe('success'));
		expect(get(controller.state).url).toBe('blob:good');

		source.set(docs('cv:\n  name: \n')); // now invalid
		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(get(controller.state).status).toBe('error'));

		const state = get(controller.state);
		expect(state.url).toBe('blob:good'); // last good preview retained
		expect(state.errors).toEqual([
			{ location: 'cv.name', message: 'Field required', yaml_source: 'main_yaml_file', yaml_line: 2 }
		]);
		expect(revokeObjectURL).not.toHaveBeenCalled(); // only replaced on a new success
		controller.destroy();
	});

	it('revokes the previous blob URL once a newer render succeeds', async () => {
		const source = writable<CvDocuments>(docs());
		let call = 0;
		const render = vi.fn(async (): Promise<RenderResult> => {
			call += 1;
			return { ok: true, blob: new Blob([`pdf-${call}`]) };
		});
		const revokeObjectURL = vi.fn();
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => `blob:${call}`,
			revokeObjectURL
		});

		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(get(controller.state).url).toBe('blob:1'));

		source.set(docs('cv:\n  name: B\n'));
		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(get(controller.state).url).toBe('blob:2'));

		expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
		controller.destroy();
	});

	it('renderNow bypasses the debounce timer', async () => {
		const source = writable<CvDocuments>(docs());
		const render = vi.fn(
			async (): Promise<RenderResult> => ({ ok: true, blob: new Blob(['pdf']) })
		);
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => 'blob:now',
			revokeObjectURL: () => {}
		});

		controller.renderNow(docs('cv:\n  name: Now\n'));
		await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
		expect(render).toHaveBeenCalledWith(docs('cv:\n  name: Now\n'));
		controller.destroy();
	});

	it('startPaused: does not react to the source (or fire a render) until activate() is called', async () => {
		const source = writable<CvDocuments>(docs());
		const render = vi.fn(async (): Promise<RenderResult> => ({ ok: true, blob: new Blob(['pdf']) }));
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => 'blob:paused',
			revokeObjectURL: () => {},
			startPaused: true
		});

		// A store change before activation (e.g. a bootstrap placeholder) must
		// not schedule a render, however long we wait.
		source.set(docs('cv:\n  name: Placeholder\n'));
		vi.advanceTimersByTime(5000);
		expect(render).not.toHaveBeenCalled();
		expect(get(controller.state).url).toBeNull();

		controller.activate();
		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
		expect(render).toHaveBeenCalledWith(docs('cv:\n  name: Placeholder\n'));

		controller.destroy();
	});

	it('startPaused: activate() is idempotent (a second call does not double-subscribe)', async () => {
		const source = writable<CvDocuments>(docs());
		const render = vi.fn(async (): Promise<RenderResult> => ({ ok: true, blob: new Blob(['pdf']) }));
		const controller = createRenderController(source, {
			debounceMs: 800,
			render,
			createObjectURL: () => 'blob:once',
			revokeObjectURL: () => {},
			startPaused: true
		});

		controller.activate();
		controller.activate();

		source.set(docs('cv:\n  name: Once\n'));
		vi.advanceTimersByTime(800);
		await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));

		controller.destroy();
	});
});
