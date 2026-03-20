<script lang="ts">
    import { onMount } from 'svelte';
    import UserStatus from '$lib/components/UserStatus.svelte';
    import Navigation from '$lib/components/Navigation.svelte';
    import ShoppingCart from '$lib/components/ShoppingCart.svelte';
    import ThemeToggle from '$lib/components/ThemeToggle.svelte';
    import { getCurrentStyleSheet, getCurrentTheme } from '$lib/colors';
    import MeshBackground from '$lib/components/MeshBackground.svelte';

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
        root.style.setProperty('--warning', stylesheet.warning);
        
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

        // Circuit-board mesh background (adapts to theme)
        const meshColor = theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.06)';
        const nodeColor = theme === 'dark' ? 'rgba(116,118,252,0.10)' : 'rgba(116,118,252,0.12)';
        const meshSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><line x1='20' y1='0' x2='20' y2='40' stroke='${meshColor}' stroke-width='0.5'/><line x1='0' y1='20' x2='40' y2='20' stroke='${meshColor}' stroke-width='0.5'/><circle cx='20' cy='20' r='1.5' fill='${nodeColor}'/></svg>`;
        root.style.setProperty('--mesh-bg', `url("data:image/svg+xml,${encodeURIComponent(meshSvg)}")`);
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

<MeshBackground />

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
        --danger: #dc3545;
        --radius: 12px;
    }

    :global(html) {
        scroll-behavior: smooth;
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
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        background-color: var(--color-background);
        color: var(--color-text);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    :global(h1), :global(h2) {
        font-family: 'Nunito', 'Inter', system-ui, sans-serif;
        line-height: 1.2;
        letter-spacing: -0.01em;
    }

    :global(h3), :global(h4), :global(h5), :global(h6) {
        font-family: 'Inter', system-ui, sans-serif;
        font-weight: 600;
        line-height: 1.3;
    }
    
    :global(*) {
        box-sizing: border-box;
    }
    
    main {
        min-height: 100vh;
        position: relative;
        z-index: 1;
    }

    @keyframes -global-fadeInUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    :global(.animate-in) {
        animation: fadeInUp 0.6s ease both;
    }

    :global(.animate-in.delay-1) { animation-delay: 0.1s; }
    :global(.animate-in.delay-2) { animation-delay: 0.2s; }
    :global(.animate-in.delay-3) { animation-delay: 0.3s; }
    :global(.animate-in.delay-4) { animation-delay: 0.4s; }
    :global(.animate-in.delay-5) { animation-delay: 0.5s; }

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
