<script lang="ts">
	import { onMount } from 'svelte';
	import { getCurrentTheme, setCurrentTheme, getCurrentStyleSheet, type ThemeMode } from '$lib/colors';

	let currentTheme = $state<ThemeMode>(getCurrentTheme());

	function updateCSSVariables(theme: ThemeMode) {
		const stylesheet = getCurrentStyleSheet();
		const root = document.documentElement;
		
		// Color properties
		root.style.setProperty('--color-primary', stylesheet.primary);
		root.style.setProperty('--color-secondary', stylesheet.secondary);
		root.style.setProperty('--color-tertiary', stylesheet.tertiary);
		root.style.setProperty('--color-accent', stylesheet.accent);
		root.style.setProperty('--color-background', stylesheet.background);
		root.style.setProperty('--color-text', stylesheet.textColor);
		root.style.setProperty('--secondary-background', stylesheet.secondaryBackground);
		root.style.setProperty('--border', stylesheet.borderColor);
		
		// Border width
		root.style.setProperty('--border-width', stylesheet.borderWidth);
		
		// Font sizes
		root.style.setProperty('--font-size', stylesheet.fontSize);
		root.style.setProperty('--font-size-h1', stylesheet.fontSizeH1);
		root.style.setProperty('--font-size-h2', stylesheet.fontSizeH2);
		root.style.setProperty('--font-size-h3', stylesheet.fontSizeH3);
		root.style.setProperty('--font-size-h4', stylesheet.fontSizeH4);
		root.style.setProperty('--font-size-h5', stylesheet.fontSizeH5);
		root.style.setProperty('--font-size-h6', stylesheet.fontSizeH6);
		
		// Additional CSS variables for compatibility
		root.style.setProperty('--primary-color', stylesheet.primary);
		root.style.setProperty('--secondary-color', stylesheet.secondary);
		root.style.setProperty('--tertiary-color', stylesheet.tertiary);
		root.style.setProperty('--accent-color', stylesheet.accent);
		root.style.setProperty('--background', stylesheet.background);
		root.style.setProperty('--text', stylesheet.textColor);
		root.style.setProperty('--textColor', stylesheet.textColor);
		root.style.setProperty('--surface', stylesheet.background);
		root.style.setProperty('--primary-dark', stylesheet.accent);
		
		// Muted color based on theme
		if (theme === 'dark') {
			root.style.setProperty('--muted', 'rgba(255, 255, 255, 0.6)');
		} else {
			root.style.setProperty('--muted', 'rgba(0, 0, 0, 0.6)');
		}
	}

	function toggleTheme() {
		const newTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light';
		setCurrentTheme(newTheme);
		currentTheme = newTheme;
		updateCSSVariables(newTheme);
		
		// Persist to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('theme-preference', newTheme);
		}
	}

	onMount(() => {
		// Load theme preference from localStorage or system preference
		let initialTheme: ThemeMode = currentTheme;
		
		if (typeof localStorage !== 'undefined') {
			const savedTheme = localStorage.getItem('theme-preference') as ThemeMode | null;
			if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
				initialTheme = savedTheme;
			} else {
				// Check system preference
				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					initialTheme = 'dark';
				} else {
					initialTheme = 'light';
				}
			}
		}
		
		// Set theme if different from current
		if (initialTheme !== currentTheme) {
			setCurrentTheme(initialTheme);
			currentTheme = initialTheme;
		}
		
		// Initial CSS variables update
		updateCSSVariables(currentTheme);
		
		// Listen for system theme changes (only if no manual preference)
		if (window.matchMedia) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = (e: MediaQueryListEvent) => {
				const savedTheme = localStorage.getItem('theme-preference');
				if (!savedTheme) {
					const newTheme: ThemeMode = e.matches ? 'dark' : 'light';
					setCurrentTheme(newTheme);
					currentTheme = newTheme;
					updateCSSVariables(newTheme);
				}
			};
			mediaQuery.addEventListener('change', handleChange);
			return () => mediaQuery.removeEventListener('change', handleChange);
		}
	});
</script>

<button 
	class="theme-toggle" 
	onclick={toggleTheme}
	aria-label="Toggle theme"
	title={currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
>
	{#if currentTheme === 'light'}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
		</svg>
		<span class="sr-only">Dark mode</span>
	{:else}
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="12" r="5"></circle>
			<line x1="12" y1="1" x2="12" y2="3"></line>
			<line x1="12" y1="21" x2="12" y2="23"></line>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
			<line x1="1" y1="12" x2="3" y2="12"></line>
			<line x1="21" y1="12" x2="23" y2="12"></line>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
		</svg>
		<span class="sr-only">Light mode</span>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: var(--border-width) solid var(--border);
		border-radius: 8px;
		background: var(--secondary-background);
		color: var(--color-text);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.theme-toggle:hover {
		background: var(--color-primary);
		color: var(--color-background);
		border-color: var(--color-primary);
		transform: scale(1.05);
	}

	.theme-toggle:active {
		transform: scale(0.95);
	}

	.theme-toggle svg {
		display: block;
		transition: transform 0.3s ease;
	}

	.theme-toggle:hover svg {
		transform: rotate(15deg);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>

