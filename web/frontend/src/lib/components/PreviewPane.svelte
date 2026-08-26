<script lang="ts">
	import type { Readable } from 'svelte/store';
	import type { PreviewState } from '$lib/preview/renderController';

	let { previewState }: { previewState: Readable<PreviewState> } = $props();

	let errorDismissed = $state(false);
	let lastErrorCount = $state(0);

	// Re-surface the error bar whenever a new batch of errors arrives, even
	// if the user had dismissed a previous batch.
	$effect(() => {
		const count = $previewState.errors.length;
		if (count > 0 && count !== lastErrorCount) {
			errorDismissed = false;
		}
		lastErrorCount = count;
	});
</script>

<section
	class="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950"
	aria-label="PDF preview"
>
	{#if $previewState.errors.length > 0 && !errorDismissed}
		<div
			class="flex items-start justify-between gap-3 border-b border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
			role="alert"
		>
			<ul class="space-y-1">
				{#each $previewState.errors as error, index (index)}
					<li>
						<span class="font-medium">{error.location}</span>{#if error.yaml_line !== null}
							<span> (line {error.yaml_line})</span>{/if}: {error.message}
					</li>
				{/each}
			</ul>
			<button
				type="button"
				class="shrink-0 rounded px-2 py-0.5 text-red-700 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900"
				aria-label="Dismiss errors"
				onclick={() => (errorDismissed = true)}
			>
				✕
			</button>
		</div>
	{/if}

	<div class="relative flex-1">
		{#if $previewState.status === 'pending' && !$previewState.hasRenderedOnce}
			<div class="absolute inset-0 flex flex-col gap-3 p-6" aria-hidden="true">
				<div class="h-8 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
				<div class="h-full w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800"></div>
			</div>
			<span class="sr-only" role="status">Rendering preview…</span>
		{:else if $previewState.url}
			<iframe title="CV PDF preview" src={$previewState.url} class="h-full w-full border-0"
			></iframe>
		{:else}
			<div class="flex h-full items-center justify-center text-sm text-neutral-500">
				Nothing to preview yet.
			</div>
		{/if}
	</div>
</section>
