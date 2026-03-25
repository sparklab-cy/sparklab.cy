<script lang="ts">
	let name = '';
	let email = '';
	let message = '';
	let submitted = false;

	function submit(e: Event) {
		e.preventDefault();
		// Client-only placeholder: wire this to an email/ticket system later.
		submitted = true;
	}
</script>

<section class="support-hero">
	<div class="support-inner animate-in">
		<p class="eyebrow">Help / Support</p>
		<h1>We’re here to help you build.</h1>
		<p class="lead">
			Questions about kits, lessons, or classroom setup? Use the FAQ below or send us a message.
		</p>
		<div class="hero-actions">
			<a href="#faq" class="primary-link">Browse FAQs</a>
			<a href="#contact" class="secondary-link">Contact Support</a>
		</div>
	</div>
</section>

<section class="support-section" id="faq">
	<div class="container">
		<h2 class="sec-heading animate-in">Frequently Asked Questions</h2>

		<div class="faq-grid">
			<details class="faq-item" open>
				<summary>How do I unlock my kit lessons?</summary>
				<p>
					Open the kit instructions, scan the included code, and follow the prompts to unlock interactive lessons.
				</p>
			</details>

			<details class="faq-item">
				<summary>My kit arrived with missing parts—what now?</summary>
				<p>
					Send us your kit name, order details, and a quick photo of what’s missing. We’ll help you get the right components.
				</p>
			</details>

			<details class="faq-item">
				<summary>Can teachers manage a classroom with ByteBlocks?</summary>
				<p>
					Yes. ByteBlocks is designed for educators with clear learning flows and progress visibility for classes.
				</p>
			</details>

			<details class="faq-item">
				<summary>Do you support both solo learning and groups?</summary>
				<p>
					Absolutely—learn at your own pace or together in workshops. The lesson flow adapts to the session style.
				</p>
			</details>
		</div>
	</div>
</section>

<section class="support-section support-contact" id="contact">
	<div class="container contact-container">
		<div class="contact-copy">
			<h2 class="sec-heading animate-in">Send us a message</h2>
			<p class="muted-lead">
				Describe what you’re trying to do. If you can, include kit name and any error text you see.
			</p>
			<div class="contact-hints">
				<div class="hint-card">
					<div class="hint-title">Response time</div>
					<div class="hint-text">Typically within 24-48 hours.</div>
				</div>
				<div class="hint-card">
					<div class="hint-title">Best info</div>
					<div class="hint-text">Kit name and steps you already tried.</div>
				</div>
			</div>
		</div>

		<form class="contact-form" on:submit={submit}>
			<label>
				<span>Your name</span>
				<input bind:value={name} type="text" required />
			</label>

			<label>
				<span>Email</span>
				<input bind:value={email} type="email" required />
			</label>

			<label>
				<span>Message</span>
				<textarea bind:value={message} rows="6" required></textarea>
			</label>

			{#if submitted}
				<div class="form-success" role="status">
					Message received. We’ll get back to you soon.
				</div>
			{:else}
				<button type="submit" class="submit-btn">Send to Support</button>
			{/if}
		</form>
	</div>
</section>

<footer class="site-footer">
	<div class="footer-inner">
		<img src="/logo.png" alt="" class="footer-logo" />
		<p>&copy; {new Date().getFullYear()} ByteBlocks. All rights reserved.</p>
	</div>
</footer>

<style>
	.support-hero {
		padding: 6rem 2rem 3.5rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.support-hero::before {
		content: '';
		display: none;
	}

	.support-inner {
		position: relative;
		z-index: 1;
		max-width: 720px;
		margin: 0 auto;
	}

	.eyebrow {
		margin: 0 0 0.8rem;
		font-size: 0.85rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		font-weight: 800;
		color: var(--color-primary);
	}

	.support-hero h1 {
		margin: 0;
		font-size: clamp(2.2rem, 4.2vw, 3.6rem);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 1.2rem auto 0;
		max-width: 620px;
		color: var(--muted);
		line-height: 1.8;
		font-size: 1rem;
	}

	.hero-actions {
		margin-top: 1.9rem;
		display: flex;
		justify-content: center;
		gap: 0.9rem;
		flex-wrap: wrap;
	}

	.primary-link,
	.secondary-link {
		display: inline-block;
		padding: 0.72rem 1.7rem;
		border-radius: 999px;
		text-decoration: none;
		font-weight: 800;
		font-size: 0.95rem;
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
	}

	.primary-link {
		background: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 60%, var(--border));
		color: #fff;
	}

	.secondary-link {
		background: var(--secondary-background);
		border: 1px solid var(--border);
		color: var(--color-text);
	}

	.primary-link:hover,
	.secondary-link:hover {
		transform: translateY(-1px);
		opacity: 0.9;
	}

	.support-section {
		padding: 3.5rem 0;
		background: var(--color-background);
	}

	.support-contact {
		background: var(--secondary-background);
		border-top: 1px solid var(--border);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.sec-heading {
		font-size: var(--font-size-h2);
		text-align: center;
		margin: 0 0 1.9rem;
		color: var(--color-text);
	}

	.faq-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.faq-item {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--color-background);
		padding: 1rem 1.1rem;
	}

	.faq-item summary {
		cursor: pointer;
		font-weight: 800;
		color: var(--color-text);
	}

	.faq-item p {
		margin: 0.7rem 0 0;
		color: var(--muted);
		line-height: 1.7;
	}

	.contact-container {
		display: grid;
		grid-template-columns: 1.05fr 0.95fr;
		gap: 1.6rem;
		align-items: start;
	}

	.contact-copy {
		padding-top: 0.15rem;
	}

	.muted-lead {
		margin: 0 auto 1.2rem;
		color: var(--muted);
		line-height: 1.8;
		max-width: 560px;
	}

	.contact-hints {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.9rem;
	}

	.hint-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--secondary-background) 70%, transparent);
		padding: 0.95rem 1rem;
	}

	.hint-title {
		font-weight: 900;
		color: var(--color-text);
	}

	.hint-text {
		margin-top: 0.25rem;
		color: var(--muted);
		line-height: 1.7;
		font-size: 0.9rem;
	}

	.contact-form {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--color-background);
		padding: 1.25rem;
	}

	.contact-form label {
		display: block;
		margin-bottom: 0.9rem;
		color: var(--color-text);
		font-weight: 800;
		font-size: 0.9rem;
	}

	.contact-form label span {
		display: block;
		margin-bottom: 0.4rem;
		color: var(--color-text);
	}

	.contact-form input,
	.contact-form textarea {
		width: 100%;
		padding: 0.7rem 0.9rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--color-background);
		color: var(--color-text);
		font-size: 1rem;
	}

	.contact-form input:focus,
	.contact-form textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.submit-btn {
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: 10px;
		border: 1px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-background);
		font-weight: 900;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
	}

	.submit-btn:hover {
		transform: translateY(-1px);
		opacity: 0.9;
	}

	.form-success {
		padding: 0.85rem 0.95rem;
		border-radius: 10px;
		border: 1px solid var(--color-primary);
		background: rgba(72, 191, 227, 0.12);
		color: var(--color-tertiary);
		font-weight: 800;
		text-align: center;
	}

	.site-footer {
		padding: 2rem;
		border-top: 1px solid var(--border);
		background: var(--secondary-background);
	}

	.footer-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
	}

	.footer-logo {
		height: 18px;
		width: auto;
		border-radius: 3px;
		opacity: 0.5;
	}

	.footer-inner p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}

	@media (max-width: 900px) {
		.faq-grid {
			grid-template-columns: 1fr;
		}

		.contact-container {
			grid-template-columns: 1fr;
		}

		.contact-hints {
			grid-template-columns: 1fr;
		}

		.container {
			padding: 0 1.25rem;
		}
	}
</style>

