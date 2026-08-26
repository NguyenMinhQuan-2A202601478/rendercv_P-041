<script lang="ts">
	import type { JsonSchemaDocument } from '$lib/schema/types';
	import { getEntryTypeDescriptors, inferEntryType, type EntryTypeName } from '$lib/schema/cvSchema';
	import type { ValidationError } from '$lib/api/validate';
	import type { PatchOp } from '$lib/form/patchOps';
	import {
		buildAddEntryOp,
		buildAddSectionOp,
		buildDeleteEntryOp,
		buildDeleteSectionOp,
		buildMoveEntryOp,
		buildRenameSectionOp
	} from '$lib/form/sectionsActions';
	import EntryEditor from './EntryEditor.svelte';
	import EntryTypePicker from './EntryTypePicker.svelte';

	/**
	 * `cv.sections` is a mapping of arbitrary titles to lists of one of 9
	 * polymorphic entry types — the one part of the CV schema that isn't a
	 * plain object/array/scalar tree `DynamicField` can walk generically, so
	 * it gets its own component (see the phase task).
	 */
	let {
		schema,
		sections,
		errors,
		submitOp
	}: {
		schema: JsonSchemaDocument;
		sections: Record<string, unknown[]>;
		errors: ValidationError[];
		submitOp: (op: PatchOp) => void;
	} = $props();

	let entryTypeDescriptors = $derived(getEntryTypeDescriptors(schema));
	function fieldsFor(type: EntryTypeName) {
		return entryTypeDescriptors.find((d) => d.type === type)?.fields ?? [];
	}

	let sectionTitles = $derived(Object.keys(sections ?? {}));
	let newSectionTitle = $state('');
	/** Draft rename text per section row (keyed by row index, not title, so an in-progress rename doesn't remount the row). */
	let titleDrafts = $state<Record<number, string>>({});

	function draftFor(index: number, title: string): string {
		return titleDrafts[index] ?? title;
	}

	function onTitleInput(index: number, next: string): void {
		titleDrafts = { ...titleDrafts, [index]: next };
	}

	function commitTitle(index: number, fromTitle: string): void {
		const draft = titleDrafts[index];
		if (draft === undefined) return;
		const trimmed = draft.trim();
		if (trimmed && trimmed !== fromTitle && !sectionTitles.includes(trimmed)) {
			submitOp(buildRenameSectionOp(sections, fromTitle, trimmed));
		}
		const rest = { ...titleDrafts };
		delete rest[index];
		titleDrafts = rest;
	}

	function addSection(): void {
		const title = newSectionTitle.trim();
		if (!title || sectionTitles.includes(title)) return;
		submitOp(buildAddSectionOp(title));
		newSectionTitle = '';
	}

	function deleteSection(title: string): void {
		submitOp(buildDeleteSectionOp(title));
	}

	function sectionType(title: string): EntryTypeName | null {
		const entries = sections[title] ?? [];
		return entries.length > 0 ? inferEntryType(entries[0]) : null;
	}

	function addEntry(title: string, type: EntryTypeName): void {
		const entries = sections[title] ?? [];
		submitOp(buildAddEntryOp(title, entries.length, type, fieldsFor(type)));
	}

	function deleteEntry(title: string, index: number): void {
		submitOp(buildDeleteEntryOp(title, index));
	}

	function moveEntry(title: string, from: number, to: number): void {
		const entries = sections[title] ?? [];
		if (to < 0 || to >= entries.length) return;
		submitOp(buildMoveEntryOp(title, from, to));
	}

	const iconButtonClass =
		'grid h-6 w-6 place-items-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800';
	const inputClass =
		'w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100';
</script>

<div class="flex flex-col gap-4">
	{#each sectionTitles as title, si (si)}
		{@const entries = sections[title] ?? []}
		{@const type = sectionType(title)}
		<section
			class="rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
			aria-label={`Section: ${title}`}
		>
			<div class="mb-2 flex items-center gap-2">
				<label class="sr-only" for={`section-title-${si}`}>Section title</label>
				<input
					id={`section-title-${si}`}
					class={`${inputClass} flex-1 font-medium`}
					value={draftFor(si, title)}
					oninput={(e) => onTitleInput(si, (e.currentTarget as HTMLInputElement).value)}
					onblur={() => commitTitle(si, title)}
					onkeydown={(e) => {
						if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
					}}
				/>
				<button
					type="button"
					class="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
					onclick={() => deleteSection(title)}
				>
					Delete section
				</button>
			</div>

			{#if entries.length === 0}
				<EntryTypePicker descriptors={entryTypeDescriptors} onSelect={(t) => addEntry(title, t)} />
			{:else}
				<ul class="flex flex-col gap-2">
					{#each entries as entry, ei (ei)}
						{@const entryType = inferEntryType(entry) ?? type ?? 'TextEntry'}
						<li class="rounded-md border border-neutral-100 p-2 dark:border-neutral-800">
							<div class="mb-1 flex items-center justify-between">
								<span class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
									{entryType}
								</span>
								<div class="flex gap-0.5" role="group" aria-label={`Entry ${ei + 1} actions`}>
									<button
										type="button"
										class={iconButtonClass}
										aria-label={`Move entry ${ei + 1} up`}
										disabled={ei === 0}
										onclick={() => moveEntry(title, ei, ei - 1)}
									>
										↑
									</button>
									<button
										type="button"
										class={iconButtonClass}
										aria-label={`Move entry ${ei + 1} down`}
										disabled={ei === entries.length - 1}
										onclick={() => moveEntry(title, ei, ei + 1)}
									>
										↓
									</button>
									<button
										type="button"
										class={iconButtonClass}
										aria-label={`Delete entry ${ei + 1}`}
										onclick={() => deleteEntry(title, ei)}
									>
										✕
									</button>
								</div>
							</div>
							<EntryEditor
								sectionTitle={title}
								entryIndex={ei}
								type={entryType}
								fields={fieldsFor(entryType)}
								value={entry}
								{errors}
								{submitOp}
							/>
						</li>
					{/each}
				</ul>
				<button
					type="button"
					class="mt-2 text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
					onclick={() => addEntry(title, type ?? 'TextEntry')}
				>
					+ Add entry
				</button>
			{/if}
		</section>
	{/each}

	<div class="flex items-center gap-2">
		<label class="sr-only" for="new-section-title">New section title</label>
		<input
			id="new-section-title"
			class={inputClass}
			placeholder="New section title (e.g. Experience)"
			bind:value={newSectionTitle}
			onkeydown={(e) => {
				if (e.key === 'Enter') addSection();
			}}
		/>
		<button
			type="button"
			class="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
			onclick={addSection}
		>
			+ Add section
		</button>
	</div>
</div>
