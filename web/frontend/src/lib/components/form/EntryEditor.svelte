<script lang="ts">
	import type { EntryTypeName } from '$lib/schema/cvSchema';
	import type { FieldDescriptor } from '$lib/schema/types';
	import type { ValidationError } from '$lib/api/validate';
	import type { PatchOp, PathSegment } from '$lib/form/patchOps';
	import {
		buildAddHighlightOp,
		buildDeleteHighlightOp,
		buildMoveHighlightOp,
		buildSetEntryFieldOp,
		buildSetEntryValueOp,
		buildSetHighlightOp
	} from '$lib/form/sectionsActions';
	import { errorsUnderPath } from '$lib/form/errorMapping';
	import DynamicField from './DynamicField.svelte';
	import FieldRow from './FieldRow.svelte';

	/**
	 * Renders one `cv.sections` entry's fields, dispatched from its inferred
	 * type (see `cvSchema.inferEntryType`). `highlights` gets its own
	 * add/delete/reorder/edit UI wired to dedicated ops (not the generic
	 * whole-array `ArrayField`), because the phase task calls out exact
	 * `insert`/`move`/`set` op shapes for it.
	 */
	let {
		sectionTitle,
		entryIndex,
		type,
		fields,
		value,
		errors,
		submitOp
	}: {
		sectionTitle: string;
		entryIndex: number;
		type: EntryTypeName;
		fields: FieldDescriptor[];
		value: unknown;
		errors: ValidationError[];
		submitOp: (op: PatchOp) => void;
	} = $props();

	const entryPath: PathSegment[] = $derived(['cv', 'sections', sectionTitle, entryIndex]);
	const nonHighlightFields = $derived(fields.filter((f) => f.key !== 'highlights'));
	const highlightsField = $derived(fields.find((f) => f.key === 'highlights'));
	const objectValue = $derived((value && typeof value === 'object' ? value : {}) as Record<string, unknown>);
	const highlights = $derived((objectValue.highlights as string[] | undefined) ?? []);

	const textEntryDescriptor: FieldDescriptor = {
		key: 'text',
		label: 'Text',
		required: true,
		nullable: false,
		kind: 'markdown'
	};

	function fieldErrors(key: string): ValidationError[] {
		return errorsUnderPath(errors, [...entryPath, key]);
	}

	function setField(key: string, fieldValue: unknown): void {
		submitOp(buildSetEntryFieldOp(sectionTitle, entryIndex, key, fieldValue));
	}

	function setTextEntry(entryValue: unknown): void {
		submitOp(buildSetEntryValueOp(sectionTitle, entryIndex, entryValue));
	}

	function addHighlight(): void {
		submitOp(buildAddHighlightOp(sectionTitle, entryIndex, highlights.length));
	}

	function deleteHighlight(index: number): void {
		submitOp(buildDeleteHighlightOp(sectionTitle, entryIndex, index));
	}

	function moveHighlight(from: number, to: number): void {
		if (to < 0 || to >= highlights.length) return;
		submitOp(buildMoveHighlightOp(sectionTitle, entryIndex, from, to));
	}

	function setHighlight(index: number, highlightValue: string): void {
		submitOp(buildSetHighlightOp(sectionTitle, entryIndex, index, highlightValue));
	}

	const iconButtonClass =
		'grid h-6 w-6 place-items-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800';
</script>

<div class="flex flex-col gap-1">
	{#if type === 'TextEntry'}
		<FieldRow
			descriptor={textEntryDescriptor}
			value={typeof value === 'string' ? value : ''}
			onchange={setTextEntry}
		/>
	{:else}
		{#each nonHighlightFields as field (field.key)}
			<DynamicField
				descriptor={field}
				value={objectValue[field.key]}
				errors={fieldErrors(field.key)}
				onchange={(fieldValue) => setField(field.key, fieldValue)}
			/>
		{/each}

		{#if highlightsField}
			<div class="flex flex-col gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{highlightsField.label}</span>
					<button
						type="button"
						class="text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
						onclick={addHighlight}
					>
						+ Add
					</button>
				</div>
				<ul class="flex flex-col gap-1.5">
					{#each highlights as highlight, hi (hi)}
						<li class="flex items-start gap-2">
							<textarea
								rows="2"
								aria-label={`Highlight ${hi + 1}`}
								placeholder={highlightsField.placeholder}
								class="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
								value={highlight}
								oninput={(e) => setHighlight(hi, (e.currentTarget as HTMLTextAreaElement).value)}
							></textarea>
							<div class="flex flex-col gap-0.5">
								<button
									type="button"
									class={iconButtonClass}
									aria-label={`Move highlight ${hi + 1} up`}
									disabled={hi === 0}
									onclick={() => moveHighlight(hi, hi - 1)}
								>
									↑
								</button>
								<button
									type="button"
									class={iconButtonClass}
									aria-label={`Move highlight ${hi + 1} down`}
									disabled={hi === highlights.length - 1}
									onclick={() => moveHighlight(hi, hi + 1)}
								>
									↓
								</button>
								<button
									type="button"
									class={iconButtonClass}
									aria-label={`Delete highlight ${hi + 1}`}
									onclick={() => deleteHighlight(hi)}
								>
									✕
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>
