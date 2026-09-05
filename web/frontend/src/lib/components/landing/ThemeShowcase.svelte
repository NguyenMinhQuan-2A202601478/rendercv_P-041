<script lang="ts">
	/**
	 * Fanned-out stack of theme preview cards, reproducing the reference
	 * hero's showcase composition. Deliberately NOT a screenshot of any real
	 * rendered PDF: each card is a neutral gray page mockup drawn with plain
	 * CSS/SVG (a header bar + a few text-line rectangles), so nothing here
	 * claims to depict actual output.
	 */
	const cards: { label: string; rotate: number; translateX: number; z: number }[] = [
		{ label: 'Classic', rotate: -10, translateX: -64, z: 1 },
		{ label: 'Sb2nov', rotate: -4, translateX: -28, z: 2 },
		{ label: 'Engineering Resumes', rotate: 2, translateX: 8, z: 3 },
		{ label: 'Moderncv', rotate: 8, translateX: 44, z: 2 },
		{ label: 'Harvard', rotate: 14, translateX: 80, z: 1 }
	];
</script>

<div class="relative mx-auto h-80 w-full max-w-sm sm:h-96" role="img" aria-label="Preview of five CV theme layouts fanned out">
	{#each cards as card, i (card.label)}
		<div
			class="reveal absolute left-1/2 top-1/2 h-72 w-52 rounded-lg border border-white/10 bg-neutral-100 shadow-2xl shadow-black/40 sm:h-80 sm:w-56"
			style={`z-index:${card.z}; transform: translate(-50%, -50%) translateX(${card.translateX}px) rotate(${card.rotate}deg); animation-delay:${i * 90}ms`}
		>
			<div class="flex h-full flex-col gap-2 p-4">
				<div class="h-3 w-2/3 rounded bg-neutral-400"></div>
				<div class="h-2 w-1/3 rounded bg-neutral-300"></div>
				<div class="mt-3 h-px w-full bg-neutral-300"></div>
				{#each Array(6) as _, line (line)}
					<div
						class="h-2 rounded bg-neutral-300"
						style={`width:${85 - ((line * 13) % 40)}%`}
					></div>
				{/each}
				<div class="mt-auto rounded bg-neutral-200 px-2 py-1 text-center text-[10px] font-medium text-neutral-500">
					{card.label}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.reveal {
		opacity: 0;
		animation: fan-in 0.7s ease-out forwards;
	}

	@keyframes fan-in {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) translateY(16px) scale(0.96);
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
			opacity: 1;
		}
	}
</style>
