import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	server: {
		proxy: {
			// The FastAPI backend (web/backend) is served separately in dev.
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true
			}
		}
	},
	worker: {
		// The client-side (wasm) preview engine's worker
		// (src/lib/wasm/engine.worker.ts) is constructed with `{ type:
		// 'module' }` and both statically imports an ESM-only package
		// (@myriaddreamin/typst.ts) and dynamically imports Pyodide's ESM
		// build from a CDN URL at runtime. Building it as an ES module
		// (Vite's default worker format is the legacy 'iife') keeps the dev
		// and production behavior of those imports consistent.
		format: 'es'
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
