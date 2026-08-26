<script lang="ts">
	import { onDestroy } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EditorPane from '$lib/components/EditorPane.svelte';
	import PreviewPane from '$lib/components/PreviewPane.svelte';
	import { createRenderController } from '$lib/preview/renderController';
	import { documents } from '$lib/stores/documents';

	const controller = createRenderController(documents);
	const previewState = controller.state;

	onDestroy(() => controller.destroy());
</script>

<svelte:head>
	<title>RenderCV Editor</title>
</svelte:head>

<div
	class="flex h-screen w-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
>
	<Sidebar />
	<main class="flex flex-1 overflow-hidden">
		<div class="w-1/2 min-w-0 border-r border-neutral-200 dark:border-neutral-800">
			<EditorPane previewState={previewState} />
		</div>
		<div class="w-1/2 min-w-0">
			<PreviewPane previewState={previewState} />
		</div>
	</main>
</div>
