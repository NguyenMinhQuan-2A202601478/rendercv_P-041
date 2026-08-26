import { writable, type Readable, type Writable } from 'svelte/store';
import type { CvDocuments } from '$lib/stores/documents';
import { renderPreview, type RenderResult, type ValidationError } from '$lib/api/render';

export type PreviewStatus = 'idle' | 'pending' | 'success' | 'error';

export interface PreviewState {
	status: PreviewStatus;
	/** The last successfully rendered blob: URL, kept visible while a newer render is invalid. */
	url: string | null;
	errors: ValidationError[];
	hasRenderedOnce: boolean;
}

export interface DocumentSource {
	subscribe: Readable<CvDocuments>['subscribe'];
}

export interface RenderControllerOptions {
	/** Idle time after the last document change before a render is triggered. */
	debounceMs?: number;
	render?: (docs: CvDocuments) => Promise<RenderResult>;
	createObjectURL?: (blob: Blob) => string;
	revokeObjectURL?: (url: string) => void;
	setTimeoutFn?: typeof setTimeout;
	clearTimeoutFn?: typeof clearTimeout;
}

export interface RenderController {
	state: Writable<PreviewState>;
	/** Renders immediately, bypassing the debounce (used by an explicit "Render" button). */
	renderNow: (docs: CvDocuments) => void;
	/** Stops listening to the document source and revokes any outstanding blob URL. */
	destroy: () => void;
}

function initialState(): PreviewState {
	return { status: 'idle', url: null, errors: [], hasRenderedOnce: false };
}

/**
 * Wires a CV-documents store to `/api/render`: debounced auto-render on every
 * change, with the last good PDF kept visible while newer input is invalid.
 *
 * Why a standalone controller instead of component-local logic: this is the
 * "sync logic" the plan requires be unit-tested without mounting Svelte
 * components or a real backend — every side effect (fetch, timers, blob URL
 * creation) is injected.
 */
export function createRenderController(
	source: DocumentSource,
	options: RenderControllerOptions = {}
): RenderController {
	const {
		debounceMs = 800,
		render = renderPreview,
		createObjectURL = (blob: Blob) => URL.createObjectURL(blob),
		revokeObjectURL = (url: string) => URL.revokeObjectURL(url),
		setTimeoutFn = setTimeout,
		clearTimeoutFn = clearTimeout
	} = options;

	const state = writable<PreviewState>(initialState());

	let timer: ReturnType<typeof setTimeout> | null = null;
	let currentUrl: string | null = null;
	let renderToken = 0;

	async function runRender(docs: CvDocuments): Promise<void> {
		const token = ++renderToken;
		state.update((s) => ({ ...s, status: 'pending' }));

		const result = await render(docs);
		if (token !== renderToken) return; // a newer render started; drop this one

		if (result.ok) {
			const nextUrl = createObjectURL(result.blob);
			const staleUrl = currentUrl;
			currentUrl = nextUrl;
			state.set({ status: 'success', url: nextUrl, errors: [], hasRenderedOnce: true });
			if (staleUrl) revokeObjectURL(staleUrl);
		} else {
			state.update((s) => ({
				status: 'error',
				url: s.url,
				errors: result.errors,
				hasRenderedOnce: s.hasRenderedOnce
			}));
		}
	}

	function scheduleRender(docs: CvDocuments): void {
		if (timer) clearTimeoutFn(timer);
		timer = setTimeoutFn(() => {
			timer = null;
			void runRender(docs);
		}, debounceMs);
	}

	const unsubscribe = source.subscribe((docs) => {
		scheduleRender(docs);
	});

	function renderNow(docs: CvDocuments): void {
		if (timer) {
			clearTimeoutFn(timer);
			timer = null;
		}
		void runRender(docs);
	}

	function destroy(): void {
		if (timer) clearTimeoutFn(timer);
		unsubscribe();
		if (currentUrl) revokeObjectURL(currentUrl);
	}

	return { state, renderNow, destroy };
}
