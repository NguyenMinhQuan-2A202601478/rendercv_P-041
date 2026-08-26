<script lang="ts">
	let collapsed = $state(false);
</script>

<aside
	class="flex h-full flex-col border-r border-neutral-200 bg-neutral-50 transition-[width] duration-150 dark:border-neutral-800 dark:bg-neutral-900"
	class:w-56={!collapsed}
	class:w-12={collapsed}
	aria-label="CV list"
>
	<div class="flex items-center justify-between p-2">
		{#if !collapsed}
			<span class="px-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Your CVs</span>
		{/if}
		<button
			type="button"
			class="ml-auto grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-expanded={!collapsed}
			onclick={() => (collapsed = !collapsed)}
		>
			{collapsed ? '»' : '«'}
		</button>
	</div>

	{#if !collapsed}
		<div class="px-2 pb-2">
			<button
				type="button"
				class="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
			>
				+ Create new CV
			</button>
		</div>

		<nav class="flex-1 overflow-y-auto px-2" aria-label="Saved CVs">
			<ul class="space-y-0.5">
				<li>
					<button
						type="button"
						class="w-full truncate rounded-md bg-purple-100 px-2 py-1.5 text-left text-sm font-medium text-purple-800 dark:bg-purple-950 dark:text-purple-200"
						aria-current="true"
					>
						Example CV
					</button>
				</li>
			</ul>
		</nav>
	{/if}
</aside>
