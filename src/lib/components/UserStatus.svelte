<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faGear,
		faArrowRightFromBracket,
		faTerminal,
		faInfo,
		faUser,
		faKeyboard,
		faChalkboardUser
	} from '@fortawesome/free-solid-svg-icons';

	let showMenu = $state(false);

    const { user } = $props();
    
    const { loggedIn, avatar_url, full_name, email, role } = user;

	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (!(e.target as HTMLElement).closest('.user-container')) {
				showMenu = false;
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	function login() {
		goto('/login');
	}

	async function logout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function toggleMenu() {
		showMenu = !showMenu;
	}
</script>

<div class="user-container">
	{#if loggedIn}
		<button
			type="button"
			class="profile-icon-button"
			onclick={toggleMenu}
			aria-label="Toggle user menu"
			aria-expanded={showMenu}
			aria-haspopup="true"
		>
			<img
				src={avatar_url ?? '/default-profile.png'}
				alt="Profile"
				class="profile-icon"
			/>
		</button>

		{#if showMenu}
			<div class="dropdown-menu" role="menu" aria-label="User menu">
				<div class="user-name">
					{full_name ?? email}
					<br />
					<span style="font-size: 0.75rem;">{role}</span>
				</div>
				<hr style="margin: 0.4rem 1rem;" />

				<button type="button" class="dropdown-item" onclick={() => goto('/profile')} role="menuitem">
					<FontAwesomeIcon icon={faUser} /> View Profile
				</button>
				<button type="button" class="dropdown-item" onclick={() => goto('/settings')} role="menuitem">
					<FontAwesomeIcon icon={faGear} /> Settings
				</button>

				<button type="button" class="dropdown-item" onclick={() => goto('/courses')} role="menuitem">
					<FontAwesomeIcon icon={faChalkboardUser} /> My Courses
				</button>

				<button type="button" class="dropdown-item" onclick={() => goto('/redeem')} role="menuitem">
					<FontAwesomeIcon icon={faKeyboard} /> Redeem Code
				</button>

				{#if role === 'admin'}
					<button type="button" class="dropdown-item" onclick={() => goto('/admin')} role="menuitem">
						<FontAwesomeIcon icon={faTerminal} /> Admin Dashboard
					</button>
				{/if}

				<button type="button" class="dropdown-item" onclick={() => goto('/support')} role="menuitem">
					<FontAwesomeIcon icon={faInfo} /> Help/Support
				</button>
				<button type="button" class="dropdown-item" onclick={logout} role="menuitem">
					<FontAwesomeIcon icon={faArrowRightFromBracket} /> Log Out
				</button>
			</div>
		{/if}
	{:else}
		<button
			onclick={login}
			class="login-button"
		>
			Log in
		</button>
	{/if}
</div>

<style>
	.user-container {
		position: relative;
		display: inline-block;
	}

	.profile-icon-button {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease;
	}

	.profile-icon-button:hover {
		transform: scale(1.05);
	}

	.profile-icon-button:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
		border-radius: 50%;
	}

	.profile-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: var(--border-width) solid var(--color-secondary);
		object-fit: cover;
		transition: border-color 0.2s ease;
		pointer-events: none;
	}

	.profile-icon-button:hover .profile-icon {
		border-color: var(--color-primary);
	}

	.login-button {
		padding: 6px 12px;
		font-size: var(--font-size);
		border: var(--border-width) solid var(--color-primary);
		border-radius: 8px;
		cursor: pointer;
		background: var(--color-background);
		color: var(--color-text);
		transition: all 0.2s ease;
	}

	.login-button:hover {
		background: var(--color-primary);
		color: var(--color-background);
	}

	.dropdown-menu {
		position: absolute;
		top: 45px;
		right: 0;
		background: var(--secondary-background);
		border-radius: 8px;
		border: var(--border-width) solid var(--border);
		z-index: 100;
		width: 15vw;
		padding-top: 4px;
		font-size: var(--font-size);
	}

	.user-name {
		padding: 8px 16px;
		font-weight: bold;
		color: var(--color-text);
		overflow: hidden;
	}

	.dropdown-item {
		width: 100%;
		padding: 5px 16px;
		text-align: left;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--color-text);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--font-size);
	}

	.dropdown-item:last-child {
		padding-bottom: 0.9rem;
	}

	.dropdown-item:hover {
		background: rgba(94, 96, 206, 0.1);
		color: var(--color-primary);
	}

	.dropdown-item:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
		background: rgba(94, 96, 206, 0.1);
	}
</style>
