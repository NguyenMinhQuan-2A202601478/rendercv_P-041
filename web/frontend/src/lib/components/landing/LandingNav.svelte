<script lang="ts">
	/**
	 * Top nav for the `/welcome` landing page. Self-contained dark styling
	 * (the reference is a dark hero regardless of the app's own light/dark
	 * theme setting) -- this route does not read or write the app's theme
	 * store, it simply always renders dark.
	 */
</script>

<header class="sticky top-0 z-20 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
		<a href="/" class="flex items-center gap-2 text-neutral-100" aria-label="RenderCV home">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
				class="text-purple-400"
			>
				<rect x="3" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.6" />
				<path d="M6.5 7h7M6.5 11h7M6.5 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				<path d="M15 15l4 4m0-4l-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
			</svg>
			<span class="text-lg font-semibold tracking-tight">RenderCV</span>
		</a>

		<a
			href="/app"
			class="rounded-md bg-purple-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
		>
			Open the editor
		</a>
	</div>
</header>
