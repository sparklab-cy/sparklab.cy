<script lang="ts">
	const { form } = $props();
</script>

<div class="container">
    <form method="POST">
        <h2>Log In</h2>
        <input name="email" type="email" value={form?.email ?? ''} placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit">Log In</button>
        {#if form?.error}
            <p class="error">{form.error}</p>
        {/if}
    </form>
    <a href="/auth/google">
        <button type="button">Log In with Google</button>
    </a>
	<div>
		Don't have an account? <a href="/signup">Create one</a>
	</div>
</div>

<style>
    form {
        width: 20vw;
		display: flex;
		flex-direction: column;
		gap: 10px;
    }
    
	.container {
		display: flex;
		justify-content: center;
        align-items: center;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        gap: 10px;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #000;
		border-radius: 4px;
		cursor: pointer;
		background: #fff;
	}

	a {
		color: #000;
		text-decoration: underline;
	}

	.error {
		color: #000;
		font-weight: bold;
	}
</style>
