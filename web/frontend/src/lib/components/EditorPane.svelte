<script lang="ts">
	import type { Readable } from 'svelte/store';
	import { DOCUMENT_KEYS, DOCUMENT_LABELS, type DocumentKey } from '$lib/stores/documents';
	import type { PreviewState } from '$lib/preview/renderController';
	import type { ValidationError } from '$lib/api/validate';
	import { groupErrorsByDocument } from '$lib/editor/errorClassification';
	import { derivePdfFilename } from '$lib/editor/filename';
	import { documents } from '$lib/stores/documents';
	import YamlEditor from '$lib/components/YamlEditor.svelte';
	import CvForm from '$lib/components/form/CvForm.svelte';

	let {
		previewState,
		errors = [],
		zoom = $bindable(100)
	}: { previewState: Readable<PreviewState>; errors?: ValidationError[]; zoom?: number } = $props();

	let activeTab = $state<DocumentKey>('cv');
	let yamlMode = $state(true);
	let yamlEditor: ReturnType<typeof YamlEditor> | undefined = $state();
	let canUndo = $state(false);
	let canRedo = $state(false);

	let errorsByTab = $derived(groupErrorsByDocument(errors));

	// Whenever the error set changes, refresh gutter markers in all four
	// documents so a tab a user hasn't opened yet is already annotated.
	$effect(() => {
		errors; // eslint-disable-line @typescript-eslint/no-unused-expressions -- track dependency
		yamlEditor?.refreshAllDiagnostics();
	});

	function errorsForTab(key: DocumentKey): ValidationError[] {
		return errorsByTab[key];
	}

	function zoomOut(): void {
		zoom = Math.max(50, zoom - 10);
	}

	function zoomIn(): void {
		zoom = Math.min(200, zoom + 10);
	}

	function resetZoom(): void {
		zoom = 100;
	}

	function download(url: string | null): void {
		if (!url) return;
		const link = document.createElement('a');
		link.href = url;
		link.download = derivePdfFilename($documents);
		link.click();
	}

	function tabClass(key: DocumentKey): string {
		const base = 'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
		return activeTab === key
			? `${base} bg-purple-600 text-white`
			: `${base} text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800`;
	}

	/** Called by the preview pane's error bar: switches to the error's tab and moves the cursor there. */
	export function goToError(error: ValidationError): void {
		const key = errorsByTab
			? (Object.keys(errorsByTab) as DocumentKey[]).find((k) => errorsByTab[k].includes(error))
			: undefined;
		if (key) activeTab = key;
		yamlMode = true;
		if (error.yaml_line !== null) {
			// Wait a tick so the editor has switched to the right document first.
			queueMicrotask(() => yamlEditor?.goToLine(error.yaml_line as number));
		}
	}
</script>

<section class="flex h-full flex-col" aria-label="CV editor">
	<div
		class="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-800"
	>
		<div role="tablist" aria-label="CV sections" class="flex gap-1">
			{#each DOCUMENT_KEYS as key (key)}
				<button
					type="button"
					role="tab"
					id={`tab-${key}`}
					aria-selected={activeTab === key}
					aria-controls={`panel-${key}`}
					tabindex={activeTab === key ? 0 : -1}
					class={tabClass(key)}
					onclick={() => (activeTab = key)}
				>
					{DOCUMENT_LABELS[key]}
					{#if errorsForTab(key).length > 0}
						<span
							class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500"
							aria-label={`${errorsForTab(key).length} error(s) in ${DOCUMENT_LABELS[key]}`}
						></span>
					{/if}
				</button>
			{/each}
		</div>

		<label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
			<span>YAML</span>
			<button
				type="button"
				role="switch"
				aria-checked={yamlMode}
				aria-label="Toggle YAML editor"
				class="relative h-5 w-9 rounded-full transition-colors"
				class:bg-purple-600={yamlMode}
				class:bg-neutral-300={!yamlMode}
				onclick={() => (yamlMode = !yamlMode)}
			>
				<span
					class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]"
					style={`left: ${yamlMode ? '1.25rem' : '0.125rem'}`}
				></span>
			</button>
		</label>
	</div>

	<div
		class="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5 dark:border-neutral-800"
	>
		<div class="flex items-center gap-1">
			<div class="flex items-center gap-0.5" role="group" aria-label="Undo/redo">
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Undo"
					disabled={!yamlMode || !canUndo}
					onclick={() => yamlEditor?.undoActive()}
				>
					↶
				</button>
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Redo"
					disabled={!yamlMode || !canRedo}
					onclick={() => yamlEditor?.redoActive()}
				>
					↷
				</button>
			</div>

			<div class="mx-1 h-4 w-px bg-neutral-300 dark:bg-neutral-700"></div>

			<div class="flex items-center gap-0.5" role="group" aria-label="Markdown formatting">
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-sm font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Bold"
					disabled={!yamlMode}
					onclick={() => yamlEditor?.wrapBold()}
				>
					B
				</button>
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-sm italic text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Italic"
					disabled={!yamlMode}
					onclick={() => yamlEditor?.wrapItalic()}
				>
					I
				</button>
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Insert link"
					disabled={!yamlMode}
					onclick={() => yamlEditor?.wrapLink()}
				>
					🔗
				</button>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1" role="group" aria-label="Zoom controls">
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Zoom out"
					disabled={zoom <= 50}
					onclick={zoomOut}
				>
					−
				</button>
				<button
					type="button"
					class="w-12 text-center text-sm tabular-nums"
					aria-label="Reset zoom to 100%"
					onclick={resetZoom}
				>
					{zoom}%
				</button>
				<button
					type="button"
					class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Zoom in"
					disabled={zoom >= 200}
					onclick={zoomIn}
				>
					+
				</button>
			</div>

			<button
				type="button"
				class="rounded-md border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
				disabled={!$previewState.url}
				onclick={() => download($previewState.url)}
			>
				Download PDF
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-auto p-3">
		<div
			id={`panel-${activeTab}`}
			role="tabpanel"
			aria-labelledby={`tab-${activeTab}`}
			class="h-full"
		>
			{#if yamlMode}
				<div class="h-full w-full rounded-md border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
					<YamlEditor
						bind:this={yamlEditor}
						activeKey={activeTab}
						errorsForKey={errorsForTab}
						bind:canUndo
						bind:canRedo
					/>
				</div>
			{:else if activeTab === 'cv'}
				<CvForm errors={errorsForTab('cv')} />
			{:else}
				<div
					class="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700"
				>
					The form editor for {DOCUMENT_LABELS[activeTab]} is generated from the schema in a
					later phase. Switch back to YAML to edit it.
				</div>
			{/if}
		</div>
	</div>
</section>
