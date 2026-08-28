<script lang="ts">
	/**
	 * `‹ value ›` cycler + dropdown, shared by the tab bar's theme switcher and
	 * the form's `StepperField` (font family, and any other "longer enum")
	 * — matches the reference's `<` `>` steppers-with-a-dropdown pattern in
	 * one place instead of two near-identical implementations.
	 *
	 * Keyboard: `‹`/`›` cycle with wraparound; the value button opens a
	 * listbox (checkmark on the current option); ArrowUp/ArrowDown move the
	 * highlight, Enter selects, Escape closes and returns focus to the
	 * trigger.
	 */
	let {
		options,
		value,
		onchange,
		ariaLabel,
		id
	}: {
		options: string[];
		value: string;
		onchange: (value: string) => void;
		ariaLabel: string;
		id?: string;
	} = $props();

	let open = $state(false);
	let highlighted = $state(0);
	let triggerEl: HTMLButtonElement | undefined = $state();
	let optionEls: (HTMLLIElement | undefined)[] = $state([]);

	function indexOfValue(): number {
		const i = options.indexOf(value);
		return i === -1 ? 0 : i;
	}

	function cycle(delta: number): void {
		if (options.length === 0) return;
		const current = indexOfValue();
		const next = (current + delta + options.length) % options.length;
		onchange(options[next]);
	}

	function openDropdown(): void {
		highlighted = indexOfValue();
		open = true;
	}

	function closeDropdown(returnFocus: boolean): void {
		open = false;
		if (returnFocus) triggerEl?.focus();
	}

	function selectHighlighted(): void {
		const option = options[highlighted];
		if (option !== undefined) onchange(option);
		closeDropdown(true);
	}

	function handleListKeydown(e: KeyboardEvent): void {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlighted = (highlighted + 1) % options.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlighted = (highlighted - 1 + options.length) % options.length;
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectHighlighted();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeDropdown(true);
		} else if (e.key === 'Tab') {
			closeDropdown(false);
		}
	}

	$effect(() => {
		if (open) optionEls[highlighted]?.focus();
	});
</script>

<div class="inline-flex items-center gap-0.5">
	<button
		type="button"
		class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-[var(--surface-card)]"
		aria-label={`Previous ${ariaLabel}`}
		onclick={() => cycle(-1)}
	>
		‹
	</button>

	<div class="relative">
		<button
			bind:this={triggerEl}
			type="button"
			{id}
			class="flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:border-[var(--border-subtle)] dark:text-neutral-100 dark:hover:bg-[var(--surface-card)]"
			aria-haspopup="listbox"
			aria-expanded={open}
			aria-label={ariaLabel}
			onclick={() => (open ? closeDropdown(false) : openDropdown())}
		>
			<span>{value}</span>
			<span aria-hidden="true">˅</span>
		</button>

		{#if open}
			<button
				type="button"
				class="fixed inset-0 z-10 cursor-default"
				aria-label="Close dropdown"
				tabindex="-1"
				onclick={() => closeDropdown(false)}
			></button>
			<ul
				role="listbox"
				aria-label={ariaLabel}
				class="absolute left-0 top-full z-20 mt-1 max-h-64 min-w-[10rem] overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-card)]"
				onkeydown={handleListKeydown}
			>
				{#each options as option, i (option)}
					<li
						bind:this={optionEls[i]}
						role="option"
						aria-selected={option === value}
						tabindex="-1"
						class="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm text-neutral-700 outline-none hover:bg-purple-50 focus:bg-purple-100 dark:text-neutral-200 dark:hover:bg-[var(--surface-card)] dark:focus:bg-neutral-800"
						onclick={() => {
							onchange(option);
							closeDropdown(true);
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onchange(option);
								closeDropdown(true);
							}
						}}
						onmouseenter={() => (highlighted = i)}
					>
						<span class="w-3" aria-hidden="true">{option === value ? '✓' : ''}</span>
						<span>{option}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<button
		type="button"
		class="grid h-6 w-6 place-items-center rounded text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-[var(--surface-card)]"
		aria-label={`Next ${ariaLabel}`}
		onclick={() => cycle(1)}
	>
		›
	</button>
</div>

<svelte:window
	onkeydown={(e) => {
		if (open && e.key === 'Escape') closeDropdown(true);
	}}
/>
