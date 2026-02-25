<script lang="ts">
    import { onMount } from 'svelte';
    import UserStatus from '$lib/components/UserStatus.svelte';
    import Navigation from '$lib/components/Navigation.svelte';
    import ShoppingCart from '$lib/components/ShoppingCart.svelte';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import { getCurrentStyleSheet, getCurrentTheme } from '$lib/colors';

    const { children, data } = $props();
    const { user, profile } = data;
    
    function updateCSSVariables() {
        const stylesheet = getCurrentStyleSheet();
        const theme = getCurrentTheme();
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
    
    onMount(() => {
        // Initialize theme from localStorage if ThemeToggle hasn't run yet
        if (typeof localStorage !== 'undefined') {
            const savedTheme = localStorage.getItem('theme-preference');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                // ThemeToggle will handle this, but we ensure CSS variables are set
            }
        }
        
        // Set initial CSS variables
        updateCSSVariables();
    });
</script>

<main>
    <Navigation />
    
	<div class="top-right-controls">
        <ThemeToggle />
        <UserStatus user={ {
            loggedIn: user !== null,
            avatar_url: user?.user_metadata.avatar_url, 
            full_name: user?.user_metadata.full_name,
            email: user?.email,
            role: profile?.role
        } }/>
	</div>

    {@render children()}
    
    <ShoppingCart on:checkout={() => {
        // Navigate to checkout page
        window.location.href = '/checkout';
    }} />
</main>

<style>
    :global(:root) {
        /* These will be set dynamically via JavaScript */
        --danger: #dc3545;
    }
    
    /* Apply smooth transitions to color-related properties globally */
    :global(*),
    :global(*)::before,
    :global(*)::after {
        transition: 
            color 10ms ease,
            background-color 10ms ease,
            border-color 10ms ease,
            box-shadow 10ms ease,
            fill 10ms ease,
            stroke 10ms ease;
    }
    
    /* Disable transitions for elements that shouldn't animate */
    :global(script),
    :global(style),
    :global(svg *),
    :global(.no-transition),
    :global(.no-transition *) {
        transition: none !important;
    }
    
    :global(body) {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background-color: var(--color-background);
        color: var(--color-text);
    }
    
    :global(*) {
        box-sizing: border-box;
    }
    
    main {
        min-height: 100vh;
        background-color: var(--color-background);
    }

    .top-right-controls {
        position: fixed;
        top: 0.7rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
</style>
