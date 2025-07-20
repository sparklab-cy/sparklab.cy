<script lang="ts">
    import UserStatus from '$lib/components/UserStatus.svelte';
    import Navigation from '$lib/components/Navigation.svelte';
    import ThemeProvider from '$lib/components/ThemeProvider.svelte';
    import ShoppingCart from '$lib/components/ShoppingCart.svelte';

    const { children, data } = $props();
    const { user, profile } = data;
</script>

<ThemeProvider />
<main>
    <Navigation user={profile} />
    
	<div style="position: fixed; top: 2rem; right: 1rem; z-index: 1000;">
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
    :global(body) {
        margin: 0;
        background-color: var(--background);
        color: var(--text);
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    }
    
    :global(*) {
        box-sizing: border-box;
    }
    
    main {
        min-height: 100vh;
        background-color: var(--background);
    }
</style>