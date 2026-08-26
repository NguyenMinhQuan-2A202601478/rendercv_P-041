<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { get, type Readable } from 'svelte/store';
	import { DOCUMENT_KEYS, DOCUMENT_LABELS, type DocumentKey } from '$lib/stores/documents';
	import type { PreviewState } from '$lib/preview/renderController';
	import type { ValidationError } from '$lib/api/validate';
	import { groupErrorsByDocument } from '$lib/editor/errorClassification';
	import { derivePdfFilename } from '$lib/editor/filename';
	import { documents } from '$lib/stores/documents';
	import { fetchThemes } from '$lib/api/themes';
	import { createFormSync } from '$lib/form/formSync';
	import { buildDiscriminatorSwitchOp } from '$lib/form/documentActions';
	import YamlEditor from '$lib/components/YamlEditor.svelte';
	import CvForm from '$lib/components/form/CvForm.svelte';
	import DesignForm from '$lib/components/form/DesignForm.svelte';
	import LocaleForm from '$lib/components/form/LocaleForm.svelte';
	import SettingsForm from '$lib/components/form/SettingsForm.svelte';
	import ThemeSwitcher from '$lib/components/form/ThemeSwitcher.svelte';
	import AutosaveStatus from '$lib/components/AutosaveStatus.svelte';
	import type { AutosaveState } from '$lib/persistence/autosave';

	let {
		previewState,
		errors = [],
		zoom = $bindable(100),
		yamlMode = $bindable(true),
		autosaveState,
		onResolveConflict = () => {},
		onRetrySave = () => {}
	}: {
		previewState: Readable<PreviewState>;
		errors?: ValidationError[];
		zoom?: number;
		yamlMode?: boolean;
		autosaveState: Readable<AutosaveState>;
		onResolveConflict?: (action: 'reload' | 'overwrite') => void;
		onRetrySave?: () => void;
	} = $props();

	let activeTab = $state<DocumentKey>('cv');
	let yamlEditor: ReturnType<typeof YamlEditor> | undefined = $state();
	let canUndo = $state(false);
	let canRedo = $state(false);

	let errorsByTab = $derived(groupErrorsByDocument(errors));

	// The theme switcher is visible on every tab (reference UX), so its
	// design-document sync is owned here rather than by `DesignForm` --
	// otherwise two independent parse/patch controllers for the same
	// document would race each other the moment both are mounted.
	const designSync = createFormSync(documents, { documentKey: 'design' });
	const designSyncState = designSync.state;

	let themeNames = $state<string[]>(['classic']);

	onMount(() => {
		void designSync.activate();
		fetchThemes()
			.then((themes) => {
				themeNames = themes.map((t) => t.name);
			})
			.catch(() => {
				// The switcher just keeps its single-item fallback list; the
				// Design form's own load-error message covers the user-visible case.
			});
	});

	onDestroy(() => {
		designSync.deactivate();
		designSync.destroy();
	});

	let currentTheme = $derived(
		(($designSyncState.data?.design as Record<string, unknown> | undefined)?.theme as string | undefined) ??
			'classic'
	);

	function switchTheme(theme: string): void {
		designSync.submitOp(buildDiscriminatorSwitchOp(get(documents).design, 'design', 'theme', theme));
	}

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
		class="flex flex-wrap items-center justify-between gap-y-1 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800"
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

		<div class="flex items-center gap-4">
			<AutosaveStatus state={autosaveState} onRetry={onRetrySave} />

			<ThemeSwitcher {themeNames} {currentTheme} onSwitch={switchTheme} />

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

	{#if $autosaveState.status === 'conflict'}
		<div
			role="alert"
			class="flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
		>
			<span>CV này đã thay đổi ở nơi khác.</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="rounded-md border border-amber-400 px-2.5 py-1 font-medium hover:bg-amber-100 dark:hover:bg-amber-900"
					onclick={() => onResolveConflict?.('reload')}
				>
					Tải bản mới
				</button>
				<button
					type="button"
					class="rounded-md bg-amber-600 px-2.5 py-1 font-medium text-white hover:bg-amber-700"
					onclick={() => onResolveConflict?.('overwrite')}
				>
					Ghi đè
				</button>
			</div>
		</div>
	{:else if $autosaveState.status === 'error'}
		<div
			role="alert"
			class="flex items-center justify-between gap-3 border-b border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
		>
			<span>Could not save your changes.</span>
			<button
				type="button"
				class="rounded-md border border-red-400 px-2.5 py-1 font-medium hover:bg-red-100 dark:hover:bg-red-900"
				onclick={() => onRetrySave?.()}
			>
				Retry
			</button>
		</div>
	{/if}

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
			{:else if activeTab === 'design'}
				<DesignForm syncState={designSyncState} submitOp={designSync.submitOp} errors={errorsForTab('design')} />
			{:else if activeTab === 'locale'}
				<LocaleForm errors={errorsForTab('locale')} />
			{:else}
				<SettingsForm errors={errorsForTab('settings')} />
			{/if}
		</div>
	</div>
</section>
