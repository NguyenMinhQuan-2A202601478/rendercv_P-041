<script lang="ts">
	import CyclerDropdown from './CyclerDropdown.svelte';

	/**
	 * Tab-bar theme quick-switcher (`‹ [name ˅] ›`), visible on every tab —
	 * matches the reference. Presentation only: the caller (`EditorPane`)
	 * owns the shared design-document sync so the switcher and the Design
	 * form's field views never race each other over the same document.
	 */
	let {
		themeNames,
		currentTheme,
		onSwitch
	}: {
		themeNames: string[];
		currentTheme: string;
		onSwitch: (theme: string) => void;
	} = $props();
</script>

<CyclerDropdown options={themeNames} value={currentTheme} onchange={onSwitch} ariaLabel="Theme" id="theme-switcher" />
