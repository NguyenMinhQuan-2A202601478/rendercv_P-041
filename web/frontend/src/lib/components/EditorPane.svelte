<script lang="ts">
	import type { Readable } from 'svelte/store';
	import {
		documents,
		setDocument,
		DOCUMENT_KEYS,
		DOCUMENT_LABELS,
		type DocumentKey
	} from '$lib/stores/documents';
	import type { PreviewState } from '$lib/preview/renderController';

	let { previewState }: { previewState: Readable<PreviewState> } = $props();

	let activeTab = $state<DocumentKey>('cv');
	let yamlMode = $state(true);
	let zoom = $state(100);

	function handleInput(key: DocumentKey, event: Event): void {
		const target = event.currentTarget as HTMLTextAreaElement;
		setDocument(key, target.value);
	}

	function zoomOut(): void {
		zoom = Math.max(50, zoom - 10);
	}

	function zoomIn(): void {
		zoom = Math.min(200, zoom + 10);
	}

	function download(url: string | null): void {
		if (!url) return;
		const link = document.createElement('a');
		link.href = url;
		link.download = 'cv.pdf';
		link.click();
	}

	function tabClass(key: DocumentKey): string {
		const base = 'rounded-md px-3 py-1.5 text-sm font-medium transition-colors';
		return activeTab === key
			? `${base} bg-purple-600 text-white`
			: `${base} text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800`;
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
			<span class="w-12 text-center text-sm tabular-nums" aria-live="polite">{zoom}%</span>
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

	<div class="flex-1 overflow-auto p-3">
		{#each DOCUMENT_KEYS as key (key)}
			<div
				id={`panel-${key}`}
				role="tabpanel"
				aria-labelledby={`tab-${key}`}
				hidden={activeTab !== key}
				class="h-full"
			>
				{#if yamlMode}
					<label class="sr-only" for={`yaml-${key}`}>{DOCUMENT_LABELS[key]} YAML</label>
					<textarea
						id={`yaml-${key}`}
						class="h-full w-full resize-none rounded-md border border-neutral-200 bg-white p-3 font-mono text-sm text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
						spellcheck="false"
						value={$documents[key]}
						oninput={(event) => handleInput(key, event)}
					></textarea>
				{:else}
					<div
						class="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700"
					>
						The form editor is generated from the schema in a later phase. Switch back to YAML to
						edit {DOCUMENT_LABELS[key]}.
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
