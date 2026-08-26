<script lang="ts">
	/**
	 * Native <details>/<summary> accordion -- keyboard- and screen-reader
	 * accessible for free (no custom ARIA state to keep in sync), styled to
	 * match the dark landing page. Copy is honest about this being a
	 * self-hosted clone: no accounts, no third-party data sharing, no fake
	 * social proof.
	 */
	const items: { question: string; answer: string }[] = [
		{
			question: 'What is this?',
			answer:
				'A self-hosted, open-source editor for RenderCV. It runs the same YAML → Typst pipeline as the `rendercv` command-line tool, wrapped in a browser form and a live PDF preview.'
		},
		{
			question: 'Is my data private?',
			answer:
				'Yes. There are no user accounts. The first time you visit the editor, the server assigns your browser an anonymous device session (a cookie), and your CVs are stored in a local SQLite database tied to that session — nothing is sent to a third-party service.'
		},
		{
			question: 'What themes are available?',
			answer:
				'All 9 themes that ship with RenderCV: Classic, Sb2nov, Moderncv, Engineering Resumes, Engineering Classic, Harvard, Ink, Opal, and Ember. Switching themes re-renders your CV instantly.'
		},
		{
			question: 'Can I use plain YAML?',
			answer:
				'Yes. Every tab has a YAML toggle in the top-right corner — switch to the raw editor at any time and edit the text directly. The form and the YAML stay in sync in both directions.'
		},
		{
			question: 'Do I need to install anything?',
			answer:
				'No. The Typst compiler and the RenderCV pipeline run on the server; your browser only needs to load this page.'
		}
	];
</script>

<section class="border-t border-white/10 bg-neutral-950 py-16" aria-labelledby="faq-heading">
	<div class="mx-auto max-w-2xl px-4 sm:px-6">
		<h2 id="faq-heading" class="text-2xl font-semibold text-neutral-100 sm:text-3xl">
			Frequently asked questions
		</h2>
		<div class="mt-8 divide-y divide-white/10 border-y border-white/10">
			{#each items as item (item.question)}
				<details class="group py-4">
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-medium text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
					>
						{item.question}
						<span class="shrink-0 text-xl text-neutral-500 transition-transform group-open:rotate-45" aria-hidden="true">
							+
						</span>
					</summary>
					<p class="mt-3 text-sm leading-relaxed text-neutral-400">
						{item.answer}
					</p>
				</details>
			{/each}
		</div>
	</div>
</section>
