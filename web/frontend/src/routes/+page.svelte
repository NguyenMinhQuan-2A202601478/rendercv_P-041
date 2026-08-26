<script lang="ts">
	import { onDestroy } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EditorPane from '$lib/components/EditorPane.svelte';
	import PreviewPane from '$lib/components/PreviewPane.svelte';
	import { createRenderController } from '$lib/preview/renderController';
	import { createValidateController } from '$lib/preview/validateController';
	import { documents } from '$lib/stores/documents';
	import type { ValidationError } from '$lib/api/validate';

	const renderController = createRenderController(documents);
	const previewState = renderController.state;

	const validateController = createValidateController(documents);
	const validationState = validateController.state;

	// Validate is the authoritative source for inline error placement (it
	// always includes yaml_source); if it hasn't reported anything wrong yet
	// but the render itself still failed (e.g. Typst/PDF generation
	// disabled), fall back to the render's own errors so nothing is missed.
	let errors = $derived<ValidationError[]>(
		$validationState.errors.length > 0 ? $validationState.errors : $previewState.errors
	);

	let editorPane: ReturnType<typeof EditorPane> | undefined = $state();
	let zoom = $state(100);

	function handleErrorClick(error: ValidationError): void {
		editorPane?.goToError(error);
	}

	onDestroy(() => {
		renderController.destroy();
		validateController.destroy();
	});
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
			<EditorPane bind:this={editorPane} {previewState} {errors} bind:zoom />
		</div>
		<div class="w-1/2 min-w-0">
			<PreviewPane {previewState} {errors} {zoom} onErrorClick={handleErrorClick} />
		</div>
	</main>
</div>
