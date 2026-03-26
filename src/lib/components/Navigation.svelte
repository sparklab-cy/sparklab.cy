<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import CartIcon from './CartIcon.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import UserStatus from './UserStatus.svelte';

	type UserStatusPayload = {
		loggedIn: boolean;
		avatar_url?: string;
		full_name?: string;
		email?: string;
		role?: string;
	};

	const { userStatus } = $props<{ userStatus: UserStatusPayload }>();

	const currentPath = $derived(page.url.pathname);
	const isShop = $derived(currentPath.startsWith('/shop'));

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	afterNavigate(() => {
		menuOpen = false;
	});
</script>

<nav class="navigation">
	<div class="nav-container">
		<div class="nav-brand">
			<a href="/" class="brand-link">
				<img src="/logo_no_bg_colored.png" alt="" class="brand-logo" />
				<span class="brand-text">ByteBlocks</span>
			</a>
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

		<button
			class="hamburger"
			class:open={menuOpen}
			onclick={toggleMenu}
			aria-label="Toggle navigation menu"
			aria-expanded={menuOpen}
		>
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
		</button>
	</div>
</nav>

{#if menuOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="mobile-overlay" onclick={closeMenu}></div>
	<div class="mobile-menu">
		<div class="mobile-menu-user">
			<div class="mobile-menu-header-row">
				<ThemeToggle />
				<UserStatus user={userStatus} />
			</div>
		</div>
		<a href="/" class="mobile-link" class:active={currentPath === '/'} onclick={closeMenu}>Home</a>
		<a href="/about" class="mobile-link" class:active={currentPath.startsWith('/about')} onclick={closeMenu}>About</a>
		<a href="/kits" class="mobile-link" class:active={currentPath.startsWith('/kits')} onclick={closeMenu}>Kits</a>
		<a href="/tools" class="mobile-link" class:active={currentPath.startsWith('/tools')} onclick={closeMenu}>Tools</a>
		<a href="/shop" class="mobile-link" class:active={currentPath.startsWith('/shop')} onclick={closeMenu}>Shop</a>
	</div>
{/if}

<style>
	.navigation {
		border-bottom: 1px solid rgba(128, 128, 128, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
		background: color-mix(in srgb, var(--color-background) 80%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 56px;
	}

	.nav-brand {
		display: flex;
		align-items: center;
	}

	.brand-link {
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Nunito', system-ui, sans-serif;
		font-weight: 800;
		font-size: 1.35rem;
		color: var(--color-primary);
		transition: opacity 0.2s ease;
	}

	.brand-link:hover {
		opacity: 0.8;
	}

	.brand-logo {
		height: 30px;
		width: auto;
		border-radius: 4px;
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
		padding: 0.4rem 0;
		border-bottom: 2px solid transparent;
		color: var(--color-text);
		font-size: 0.9rem;
		letter-spacing: 0.01em;
		transition: color 0.2s ease, border-color 0.2s ease;
	}

	.nav-link:hover {
		color: var(--color-primary);
	}

	.nav-link.active {
		border-bottom-color: var(--color-primary);
		color: var(--color-primary);
		font-weight: 600;
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

	/* ── Hamburger button ─────────────────────── */
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 36px;
		height: 36px;
		padding: 6px;
		background: none;
		border: none;
		cursor: pointer;
		z-index: 110;
	}

	.bar {
		display: block;
		width: 100%;
		height: 2px;
		background: var(--color-text);
		border-radius: 2px;
		transition: transform 0.25s ease, opacity 0.2s ease;
		transform-origin: center;
	}

	.hamburger.open .bar:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}

	.hamburger.open .bar:nth-child(2) {
		opacity: 0;
	}

	.hamburger.open .bar:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	/* ── Mobile overlay + menu ────────────────── */
	.mobile-overlay {
		display: none;
	}

	.mobile-menu {
		display: none;
	}

	/* ── Responsive ───────────────────────────── */
	@media (max-width: 768px) {
		.nav-container {
			padding: 0 1rem;
		}

		.nav-right {
			display: none;
		}

		.hamburger {
			display: flex;
		}

		.mobile-overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.4);
			z-index: 99;
			animation: fadeIn 0.2s ease;
		}

		.mobile-menu {
			display: flex;
			flex-direction: column;
			position: fixed;
			top: 56px;
			left: 0;
			right: 0;
			z-index: 101;
			background: var(--color-background);
			border-bottom: 1px solid var(--border);
			padding: 0.75rem 0;
			animation: slideDown 0.25s ease;
		}

		.mobile-menu-user {
			padding: 0.5rem 1.5rem 1rem;
			border-bottom: 1px solid var(--border);
		}

		.mobile-menu-header-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
		}

		.mobile-menu-user :global(.user-container) {
			display: block;
			flex-shrink: 0;
		}

		.mobile-menu-user :global(.dropdown-menu) {
			width: min(100%, 280px);
			right: auto;
			left: 0;
		}

		.mobile-link {
			display: block;
			padding: 0.85rem 1.5rem;
			text-decoration: none;
			color: var(--color-text);
			font-weight: 600;
			font-size: 1rem;
			transition: background 0.15s ease, color 0.15s ease;
		}

		.mobile-link:hover {
			background: var(--secondary-background);
			color: var(--color-primary);
		}

		.mobile-link.active {
			color: var(--color-primary);
			background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		}

		.brand-text {
			font-size: 1.2rem;
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
