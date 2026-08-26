<script lang="ts">
	import { tick } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { CvSummary } from '$lib/api/cvs';
	import type { ActiveCvMeta } from '$lib/stores/cvSession';
	import { formatRelativeTime } from '$lib/app/relativeTime';
	import { listVersions, type CvVersionSummary } from '$lib/api/cvs';

	let {
		cvs,
		activeCv,
		collapsed = $bindable(false),
		onSwitch,
		onCreate,
		onRename,
		onDuplicate,
		onDelete,
		onRestore
	}: {
		cvs: Readable<CvSummary[]>;
		activeCv: Readable<ActiveCvMeta | null>;
		collapsed?: boolean;
		onSwitch: (id: number) => void;
		onCreate: () => void;
		onRename: (id: number, name: string) => void;
		onDuplicate: (id: number) => void;
		onDelete: (id: number) => void;
		onRestore: (id: number, versionId: number) => void;
	} = $props();

	let menuOpenId = $state<number | null>(null);
	let renamingId = $state<number | null>(null);
	let renameValue = $state('');
	let renameInputEl: HTMLInputElement | undefined = $state();
	let confirmDeleteId = $state<number | null>(null);
	let historyId = $state<number | null>(null);
	let historyVersions = $state<CvVersionSummary[] | null>(null);
	let historyLoading = $state(false);

	function toggleMenu(id: number): void {
		menuOpenId = menuOpenId === id ? null : id;
	}

	function closeMenu(): void {
		menuOpenId = null;
	}

	async function startRename(cv: CvSummary): Promise<void> {
		closeMenu();
		renamingId = cv.id;
		renameValue = cv.name;
		await tick();
		renameInputEl?.focus();
		renameInputEl?.select();
	}

	function commitRename(id: number): void {
		if (renamingId !== id) return;
		const name = renameValue.trim();
		renamingId = null;
		if (name !== '') onRename(id, name);
	}

	function cancelRename(): void {
		renamingId = null;
	}

	function askDelete(id: number): void {
		closeMenu();
		confirmDeleteId = id;
	}

	function confirmDelete(): void {
		if (confirmDeleteId !== null) onDelete(confirmDeleteId);
		confirmDeleteId = null;
	}

	function cancelDelete(): void {
		confirmDeleteId = null;
	}

	async function openHistory(id: number): Promise<void> {
		closeMenu();
		historyId = id;
		historyVersions = null;
		historyLoading = true;
		try {
			historyVersions = (await listVersions(id)) ?? [];
		} finally {
			historyLoading = false;
		}
	}

	function closeHistory(): void {
		historyId = null;
		historyVersions = null;
	}

	function restoreVersion(id: number, versionId: number): void {
		onRestore(id, versionId);
		closeHistory();
	}

	function duplicate(id: number): void {
		closeMenu();
		onDuplicate(id);
	}
</script>

<aside
	class="flex h-full flex-col border-r border-neutral-200 bg-neutral-50 transition-[width] duration-150 dark:border-neutral-800 dark:bg-neutral-900"
	class:w-64={!collapsed}
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
				onclick={onCreate}
			>
				+ Create new CV
			</button>
		</div>

		<nav class="flex-1 overflow-y-auto px-2" aria-label="Saved CVs">
			<ul class="space-y-0.5">
				{#each $cvs as cv (cv.id)}
					{@const active = $activeCv?.id === cv.id}
					<li class="relative">
						{#if renamingId === cv.id}
							<input
								bind:this={renameInputEl}
								bind:value={renameValue}
								aria-label={`Rename ${cv.name}`}
								class="w-full rounded-md border border-purple-400 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none dark:bg-neutral-800 dark:text-neutral-100"
								onblur={() => commitRename(cv.id)}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										commitRename(cv.id);
									} else if (e.key === 'Escape') {
										e.preventDefault();
										cancelRename();
									}
								}}
							/>
						{:else}
							<div class="flex items-center gap-1">
								<button
									type="button"
									class="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm font-medium"
									class:bg-purple-100={active}
									class:text-purple-800={active}
									class:dark:bg-purple-950={active}
									class:dark:text-purple-200={active}
									class:text-neutral-700={!active}
									class:hover:bg-neutral-100={!active}
									class:dark:text-neutral-200={!active}
									class:dark:hover:bg-neutral-800={!active}
									aria-current={active ? 'true' : undefined}
									onclick={() => onSwitch(cv.id)}
								>
									<span class="block truncate">{cv.name}</span>
									<span class="block truncate text-xs font-normal text-neutral-500 dark:text-neutral-400">
										{formatRelativeTime(cv.updatedAt)}
									</span>
								</button>

								<button
									type="button"
									class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
									aria-label={`More actions for ${cv.name}`}
									aria-haspopup="menu"
									aria-expanded={menuOpenId === cv.id}
									onclick={() => toggleMenu(cv.id)}
								>
									⋯
								</button>
							</div>

							{#if menuOpenId === cv.id}
								<button
									type="button"
									class="fixed inset-0 z-10 cursor-default"
									aria-label="Close menu"
									tabindex="-1"
									onclick={closeMenu}
								></button>
								<ul
									role="menu"
									aria-label={`Actions for ${cv.name}`}
									class="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
								>
									<li role="none">
										<button
											role="menuitem"
											type="button"
											class="w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
											onclick={() => startRename(cv)}
										>
											Rename
										</button>
									</li>
									<li role="none">
										<button
											role="menuitem"
											type="button"
											class="w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
											onclick={() => duplicate(cv.id)}
										>
											Duplicate
										</button>
									</li>
									<li role="none">
										<button
											role="menuitem"
											type="button"
											class="w-full px-3 py-1.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
											onclick={() => openHistory(cv.id)}
										>
											History…
										</button>
									</li>
									<li role="none">
										<button
											role="menuitem"
											type="button"
											class="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
											onclick={() => askDelete(cv.id)}
										>
											Delete
										</button>
									</li>
								</ul>
							{/if}

							{#if historyId === cv.id}
								<div
									class="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
								>
									<div class="mb-1 flex items-center justify-between">
										<span class="font-medium text-neutral-700 dark:text-neutral-200">History</span>
										<button
											type="button"
											class="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
											aria-label="Close history"
											onclick={closeHistory}
										>
											✕
										</button>
									</div>
									{#if historyLoading}
										<p class="text-neutral-500 dark:text-neutral-400">Loading…</p>
									{:else if !historyVersions || historyVersions.length === 0}
										<p class="text-neutral-500 dark:text-neutral-400">No saved versions yet.</p>
									{:else}
										<ul class="max-h-48 space-y-0.5 overflow-y-auto">
											{#each historyVersions as version (version.id)}
												<li>
													<button
														type="button"
														class="w-full rounded px-2 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
														onclick={() => restoreVersion(cv.id, version.id)}
													>
														{formatRelativeTime(version.createdAt)}
													</button>
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							{/if}

							{#if confirmDeleteId === cv.id}
								<div
									role="alertdialog"
									aria-label={`Delete ${cv.name}?`}
									class="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-neutral-200 bg-white p-3 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
								>
									<p class="mb-2 text-neutral-700 dark:text-neutral-200">Delete "{cv.name}"? This cannot be undone.</p>
									<div class="flex justify-end gap-2">
										<button
											type="button"
											class="rounded-md border border-neutral-300 px-2.5 py-1 dark:border-neutral-700"
											onclick={cancelDelete}
										>
											Cancel
										</button>
										<button
											type="button"
											class="rounded-md bg-red-600 px-2.5 py-1 font-medium text-white hover:bg-red-700"
											onclick={confirmDelete}
										>
											Delete
										</button>
									</div>
								</div>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<div class="border-t border-neutral-200 p-2 dark:border-neutral-800">
			<a
				href="/welcome"
				class="block rounded-md px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				About
			</a>
		</div>
	{/if}
</aside>

<svelte:window
	onkeydown={(e) => {
		if (e.key !== 'Escape') return;
		if (menuOpenId !== null) closeMenu();
		if (historyId !== null) closeHistory();
		if (confirmDeleteId !== null) cancelDelete();
	}}
/>
