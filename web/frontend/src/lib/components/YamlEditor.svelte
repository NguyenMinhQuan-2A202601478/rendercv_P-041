<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
	import {
		defaultKeymap,
		history,
		historyKeymap,
		insertNewlineKeepIndent,
		undo,
		redo,
		undoDepth,
		redoDepth
	} from '@codemirror/commands';
	import { yaml } from '@codemirror/lang-yaml';
	import { indentUnit } from '@codemirror/language';
	import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
	import { documents, setDocument, type DocumentKey } from '$lib/stores/documents';
	import type { ValidationError } from '$lib/api/validate';
	import {
		DocumentEditorRegistry,
		externalDocUpdate,
		isSyncTransaction,
		lineDiagnostic
	} from '$lib/editor/documentEditors';
	import { wrapSelection, wrapAsLink } from '$lib/editor/markdownToolbar';

	let {
		activeKey,
		errorsForKey = () => [],
		canUndo = $bindable(false),
		canRedo = $bindable(false)
	}: {
		activeKey: DocumentKey;
		/** Returns the validation errors that belong to a given document. */
		errorsForKey?: (key: DocumentKey) => ValidationError[];
		canUndo?: boolean;
		canRedo?: boolean;
	} = $props();

	let container: HTMLDivElement | undefined = $state();
	let view: EditorView | undefined;
	let registry: DocumentEditorRegistry | undefined;
	let unsubscribeStore: (() => void) | undefined;

	const baseTheme = EditorView.theme({
		'&': {
			height: '100%',
			fontSize: '13px',
			backgroundColor: 'transparent'
		},
		'.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflow: 'auto' },
		'.cm-content': { padding: '0.5rem 0' },
		'&.cm-focused': { outline: 'none' },
		'.cm-gutters': { backgroundColor: 'transparent', border: 'none' }
	});

	function extensionsFor(key: DocumentKey) {
		return [
			lineNumbers(),
			highlightActiveLine(),
			history(),
			indentUnit.of('  '),
			yaml(),
			linter(null),
			lintGutter(),
			baseTheme,
			// Plain "keep current indent" on Enter rather than the default
			// language-aware auto-indent: predictable for hand-edited YAML,
			// and matches the reference editor's plain-text feel.
			keymap.of([{ key: 'Enter', run: insertNewlineKeepIndent }, ...defaultKeymap, ...historyKeymap]),
			EditorView.updateListener.of((update) => {
				registry?.set(key, update.state);
				if (key === activeKey) {
					canUndo = undoDepth(update.state) > 0;
					canRedo = redoDepth(update.state) > 0;
				}
				if (update.docChanged) {
					const echo = update.transactions.some(isSyncTransaction);
					if (!echo) {
						setDocument(key, update.state.doc.toString());
					}
				}
			})
		];
	}

	function diagnosticsFor(key: DocumentKey): Diagnostic[] {
		const state = registry?.get(key);
		if (!state) return [];
		const out: Diagnostic[] = [];
		for (const error of errorsForKey(key)) {
			if (error.yaml_line === null) continue;
			const diagnostic = lineDiagnostic(state, error.yaml_line, error.message, 'error');
			if (diagnostic) out.push(diagnostic);
		}
		return out;
	}

	function refreshDiagnostics(key: DocumentKey): void {
		if (!registry) return;
		registry.setDiagnostics(key, diagnosticsFor(key));
	}

	onMount(() => {
		registry = new DocumentEditorRegistry($documents, extensionsFor);
		for (const key of ['cv', 'design', 'locale', 'settings'] as DocumentKey[]) {
			refreshDiagnostics(key);
		}

		view = new EditorView({
			state: registry.get(activeKey),
			parent: container
		});
		canUndo = undoDepth(view.state) > 0;
		canRedo = redoDepth(view.state) > 0;

		unsubscribeStore = documents.subscribe((docs) => {
			if (!registry) return;
			for (const key of ['cv', 'design', 'locale', 'settings'] as DocumentKey[]) {
				if (key === activeKey && view) {
					const spec = externalDocUpdate(view.state, docs[key]);
					if (spec) view.dispatch(spec);
				} else {
					registry.syncFromStore(key, docs[key]);
				}
			}
		});
	});

	onDestroy(() => {
		unsubscribeStore?.();
		view?.destroy();
	});

	// Switch the live view's EditorState when the active tab changes, without
	// losing the outgoing tab's cursor/scroll/undo history (kept in registry).
	$effect(() => {
		const key = activeKey;
		if (!view || !registry) return;
		refreshDiagnostics(key);
		view.setState(registry.get(key));
		canUndo = undoDepth(view.state) > 0;
		canRedo = redoDepth(view.state) > 0;
	});

	/** Re-applies diagnostics whenever the caller's error set changes. */
	export function refreshAllDiagnostics(): void {
		if (!registry) return;
		for (const key of ['cv', 'design', 'locale', 'settings'] as DocumentKey[]) {
			refreshDiagnostics(key);
		}
		if (view) view.setState(registry.get(activeKey));
	}

	export function undoActive(): void {
		if (!view) return;
		undo(view);
	}

	export function redoActive(): void {
		if (!view) return;
		redo(view);
	}

	function applyWrap(result: { text: string; selectionStart: number; selectionEnd: number }): void {
		if (!view) return;
		view.dispatch({
			changes: { from: 0, to: view.state.doc.length, insert: result.text },
			selection: { anchor: result.selectionStart, head: result.selectionEnd }
		});
		view.focus();
	}

	export function wrapBold(): void {
		if (!view) return;
		const { from, to } = view.state.selection.main;
		applyWrap(wrapSelection(view.state.doc.toString(), from, to, '**', '**'));
	}

	export function wrapItalic(): void {
		if (!view) return;
		const { from, to } = view.state.selection.main;
		applyWrap(wrapSelection(view.state.doc.toString(), from, to, '*', '*'));
	}

	export function wrapLink(): void {
		if (!view) return;
		const { from, to } = view.state.selection.main;
		applyWrap(wrapAsLink(view.state.doc.toString(), from, to));
	}

	/** Switches focus to a line (1-indexed) in this document's editor. Caller switches the active tab first. */
	export function goToLine(line: number): void {
		if (!view) return;
		if (line < 1 || line > view.state.doc.lines) return;
		const { from } = view.state.doc.line(line);
		view.dispatch({ selection: { anchor: from }, scrollIntoView: true });
		view.focus();
	}
</script>

<div class="h-full w-full" bind:this={container}></div>
