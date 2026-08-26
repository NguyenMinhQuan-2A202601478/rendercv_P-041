<script lang="ts">
	import type { FieldDescriptor } from '$lib/schema/types';
	import type { ValidationError } from '$lib/api/validate';
	import DynamicField from './DynamicField.svelte';

	let {
		descriptor,
		value,
		onFieldChange,
		errorsForField = () => []
	}: {
		descriptor: FieldDescriptor;
		value: Record<string, unknown>;
		onFieldChange: (key: string, value: unknown) => void;
		errorsForField?: (key: string) => ValidationError[];
	} = $props();
</script>

<fieldset class="flex flex-col gap-0 rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
	{#if descriptor.label}
		<legend class="px-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">
			{descriptor.label}
		</legend>
	{/if}
	{#each descriptor.fields ?? [] as field (field.key)}
		<DynamicField
			descriptor={field}
			value={value?.[field.key]}
			errors={errorsForField(field.key)}
			onchange={(fieldValue) => onFieldChange(field.key, fieldValue)}
		/>
	{/each}
</fieldset>
