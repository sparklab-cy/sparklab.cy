<script lang="ts">
	const { form } = $props();
</script>

<div class="auth-page">
	<div class="auth-card animate-in">
		<img src="/logo.png" alt="ByteBlocks" class="auth-logo" />
		<h2>Welcome Back</h2>
		<p class="auth-subtitle">Log in to your ByteBlocks account</p>

		<form method="POST" class="auth-form">
			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" value={form?.email ?? ''} placeholder="you@example.com" required />
			</div>
			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" placeholder="Your password" required />
			</div>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
			<button type="submit" class="btn-primary">Log In</button>
		</form>

		<div class="divider">
			<span>or</span>
		</div>

		<a href="/auth/google" class="btn-google">
			Continue with Google
		</a>

		<p class="auth-footer">
			Don't have an account? <a href="/signup">Create one</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 56px);
		padding: 2rem;
		background:
			radial-gradient(ellipse 60% 50% at 50% 30%, rgba(116, 118, 252, 0.06) 0%, transparent 70%),
			var(--color-background);
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		padding: 2.5rem 2rem;
		background: var(--secondary-background);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
		text-align: center;
	}

	.auth-logo {
		width: 56px;
		height: auto;
		border-radius: 8px;
		margin-bottom: 1.25rem;
	}

	.auth-card h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.auth-subtitle {
		color: var(--muted);
		font-size: 0.9rem;
		margin: 0 0 1.75rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		text-align: left;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.field input {
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: 0.95rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(116, 118, 252, 0.15);
	}

	.error {
		margin: 0;
		padding: 0.6rem 0.75rem;
		background: rgba(220, 53, 69, 0.1);
		border: 1px solid var(--danger);
		border-radius: 6px;
		color: var(--danger);
		font-size: 0.85rem;
	}

	.btn-primary {
		padding: 0.75rem;
		background: var(--color-primary);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s ease, transform 0.15s ease;
	}

	.btn-primary:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 1.25rem 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.divider::before, .divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.btn-google {
		display: block;
		padding: 0.7rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
		transition: background 0.2s ease, border-color 0.2s ease;
	}

	.btn-google:hover {
		background: var(--color-background);
		border-color: var(--color-primary);
	}

	.auth-footer {
		margin: 1.5rem 0 0;
		font-size: 0.875rem;
		color: var(--muted);
	}

	.auth-footer a {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}
</style>
