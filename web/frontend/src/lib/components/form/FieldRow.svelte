<script lang="ts">
	import type { FieldDescriptor } from '$lib/schema/types';
	import type { ValidationError } from '$lib/api/validate';

	let {
		descriptor,
		value,
		errors = [],
		onchange
	}: {
		descriptor: FieldDescriptor;
		value: unknown;
		errors?: ValidationError[];
		onchange: (value: unknown) => void;
	} = $props();

	const instanceId = Math.random().toString(36).slice(2, 8);
	let fieldId = $derived(`field-${descriptor.key}-${instanceId}`);

	function handleTextInput(e: Event): void {
		const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
		onchange(target.value);
	}

	function handleNumberInput(e: Event): void {
		const target = e.currentTarget as HTMLInputElement;
		onchange(target.value === '' ? null : Number(target.value));
	}

	function toggleBoolean(): void {
		onchange(!value);
	}

	function selectEnumOption(option: string): void {
		onchange(option);
	}

	const inputClass =
		'w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-600';
</script>

<div
	class="flex flex-col gap-1 border-b border-neutral-100 py-2 last:border-b-0 dark:border-neutral-800 sm:flex-row sm:items-start sm:gap-4"
>
	<label
		for={fieldId}
		class="w-full shrink-0 pt-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 sm:w-40"
	>
		{descriptor.label}
		{#if descriptor.required}
			<span class="text-red-500" aria-hidden="true"> *</span>
		{/if}
	</label>

	<div class="flex min-w-0 flex-1 flex-col gap-1">
		{#if descriptor.kind === 'boolean'}
			<button
				type="button"
				id={fieldId}
				role="switch"
				aria-checked={Boolean(value)}
				aria-label={descriptor.label}
				class="relative h-5 w-9 rounded-full transition-colors"
				class:bg-purple-600={Boolean(value)}
				class:bg-neutral-300={!value}
				onclick={toggleBoolean}
			>
				<span
					class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]"
					style={`left: ${value ? '1.25rem' : '0.125rem'}`}
				></span>
			</button>
		{:else if descriptor.kind === 'enum'}
			<div id={fieldId} role="radiogroup" aria-label={descriptor.label} class="flex flex-wrap gap-1">
				{#each descriptor.enumValues ?? [] as option (option)}
					<button
						type="button"
						role="radio"
						aria-checked={value === option}
						class="rounded-md border px-2 py-1 text-xs font-medium transition-colors"
						class:border-purple-600={value === option}
						class:bg-purple-600={value === option}
						class:text-white={value === option}
						class:border-neutral-300={value !== option}
						class:text-neutral-600={value !== option}
						class:dark:border-neutral-700={value !== option}
						class:dark:text-neutral-300={value !== option}
						onclick={() => selectEnumOption(option)}
					>
						{option}
					</button>
				{/each}
			</div>
		{:else if descriptor.kind === 'markdown'}
			<textarea
				id={fieldId}
				rows="3"
				class={inputClass}
				placeholder={descriptor.placeholder}
				value={typeof value === 'string' ? value : ''}
				oninput={handleTextInput}
			></textarea>
		{:else if descriptor.kind === 'number'}
			<input
				id={fieldId}
				type="number"
				class={inputClass}
				placeholder={descriptor.placeholder}
				value={typeof value === 'number' ? value : ''}
				oninput={handleNumberInput}
			/>
		{:else}
			<input
				id={fieldId}
				type={descriptor.kind === 'url' ? 'url' : 'text'}
				class={inputClass}
				placeholder={descriptor.placeholder}
				value={typeof value === 'string' ? value : ''}
				oninput={handleTextInput}
			/>
		{/if}

		{#if descriptor.description}
			<p class="text-xs text-neutral-400 dark:text-neutral-500">{descriptor.description}</p>
		{/if}

		{#if errors.length > 0}
			<p role="alert" class="text-xs font-medium text-red-600 dark:text-red-400">
				{errors[0].message}
			</p>
		{/if}
	</div>
</div>
