<script lang="ts">
	import { page } from '$app/state';
	import CartIcon from './CartIcon.svelte';
	const currentPath = $derived(page.url.pathname);
	const isShop = $derived(currentPath.startsWith('/shop'));
</script>

<nav class="navigation">
  	<div class="nav-container">
		<div class="nav-brand">
			<a href="/" class="brand-link"><span class="brand-text">ByteBlocks</span></a>
		</div>
	
	<div class="nav-right" class:is-shop={isShop}>
		<div class="cart-icon panel" class:visible={isShop} class:hidden={!isShop}>
			<CartIcon />
		</div>

		<div class="nav-links panel" class:visible={!isShop} class:hidden={isShop}>
			<a href="/" class="nav-link" class:active={currentPath === '/'}>Home</a>
			<a href="/about" class="nav-link" class:active={currentPath.startsWith('/about')}>About</a>
			<a href="/kits" class="nav-link" class:active={currentPath.startsWith('/kits')}>Kits</a>
			<a href="/tools" class="nav-link" class:active={currentPath.startsWith('/tools')}>Tools</a>
			<a href="/shop" class="nav-link" class:active={currentPath.startsWith('/shop')}>Shop</a>
		</div>
	</div>
  	</div>
</nav>

<style>
	.navigation {
		border-bottom: 1px solid var(--secondary-background);
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--color-background);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 60px;
	}

	.nav-brand {
		display: flex;
		align-items: center;
	}

	.brand-link {
		text-decoration: none;
		font-weight: bold;
		font-size: var(--font-size-h2);
		color: var(--color-primary);
		transition: color 0.2s ease;
	}

	.brand-link:hover {
		color: var(--color-accent);
	}

	.brand-text {
		color: var(--color-primary);
	}

	.nav-links {
		display: flex;
		gap: 2rem;
		align-items: center;
		transition: all 300ms;
	}

	.nav-link {
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 0;
		border-bottom: var(--border-width) solid transparent;
		color: var(--color-text);
		font-size: var(--font-size);
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		color: var(--color-primary);
		border-bottom: var(--border-width) solid var(--color-secondary);
	}

	.nav-link.active {
		border-bottom: var(--border-width) solid var(--color-primary);
		color: var(--color-primary);
	}

	.nav-right {
		position: relative;
		width: 220px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.panel {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		transition: transform 200ms ease, opacity 200ms ease;
		will-change: transform, opacity;
		pointer-events: none;
	}

	.visible {
		transform: translateY(-50%) translateX(0);
		opacity: 1;
		pointer-events: auto;
	}

	.hidden {
		transform: translateY(-70%) translateX(0);
		opacity: 0;
		pointer-events: none;
	}


	@media (max-width: 768px) {
		.nav-container {
		padding: 0 1rem;
		}

		.nav-links {
		gap: 1rem;
		}

		.brand-text {
		font-size: 1.2rem;
		}
	}
</style>
