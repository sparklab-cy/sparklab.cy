<script lang="ts">
	const year = new Date().getFullYear();
</script>

<main class="hero">
	<div class="hero-content">
		<h1>ByteBlocks</h1>
		<p>
			Spark Curiosity. Build the Future.<br />
			Hands-on electronics kits with interactive lessons — built for education and exploration.
		</p>
		<a href="/shop" class="button">Explore Kits</a>
	</div>
</main>

<section class="steps">
	<div class="step">
		<h3>Step 1</h3>
		<p>Pick a color-coded kit. Choose your theme & level (1–5).</p>
	</div>
	<div class="step">
		<h3>Step 2</h3>
		<p>Scan the code to unlock lessons and build instructions.</p>
	</div>
	<div class="step">
		<h3>Step 3</h3>
		<p>Assemble circuits and upload code to see your project come alive.</p>
	</div>
	<div class="step">
		<h3>Step 4</h3>
		<p>Learn solo or in class. Teachers can unlock lessons over time.</p>
	</div>
</section>

<section class="themes">
	<h2>Popular Kit Themes</h2>
	<div class="theme-grid">
		<div class="theme-card">
			<h3>Space Probe</h3>
			<p>Simulate real missions: sensors, data, and transmission.</p>
		</div>
		<div class="theme-card">
			<h3>Environmental Lab</h3>
			<p>Track temperature, humidity, pressure and light.</p>
		</div>
		<div class="theme-card">
			<h3>Art & Light</h3>
			<p>Create dynamic Neopixel animations and mood lamps.</p>
		</div>
	</div>
</section>

<section class="schools">
	<h2>Used in Schools Across Europe</h2>
	<p>Electrofun kits come with teacher tools, classroom progress tracking, and editable content.</p>
	<a href="/schools" class="button">For Schools & Educators</a>
</section>

<footer>
	<p>&copy; {year} Michalis Chatzitofi. All rights reserved.</p>
</footer>

<style>
	main.hero {
		padding: 25vh 2rem;
		text-align: center;
		background: linear-gradient(135deg, var(--color-background) 0%, rgba(94, 96, 206, 0.05) 100%);
	}
	.hero-content h1 {
		font-size: var(--font-size-h1);
		margin-bottom: 1rem;
		color: var(--color-text);
	}
	.hero-content p {
		font-size: var(--font-size);
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		color: var(--color-text);
	}
	.button {
		padding: 0.75rem 1.5rem;
		border: var(--border-width) solid var(--color-primary);
		border-radius: 8px;
		text-decoration: none;
		font-weight: bold;
		display: inline-block;
		background: var(--color-primary);
		color: var(--color-background);
		transition: all 0.3s ease;
	}
	
	.button:hover {
		background: var(--color-accent);
		border-color: var(--color-accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(94, 96, 206, 0.3);
	}

	section.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		padding: 4rem 2rem;
		text-align: center;
		background: var(--color-background);
	}
	.step {
		padding: 1.5rem;
		border-radius: 8px;
		border: var(--border-width) solid var(--border);
		background: var(--secondary-background);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.step h3 {
		margin-bottom: 0.5rem;
		font-size: var(--font-size-h3);
		color: var(--color-text);
	}
	.step p {
		font-size: var(--font-size);
		color: var(--color-text);
	}

	section.themes {
		padding: 4rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, rgba(83, 144, 217, 0.05) 0%, var(--color-background) 100%);
	}
	.themes h2 {
		font-size: var(--font-size-h2);
		margin-bottom: 2rem;
		color: var(--color-text);
	}
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}
	.theme-card {
		padding: 1.5rem;
		border: var(--border-width) solid var(--border);
		border-radius: 8px;
		background: var(--secondary-background);
		transition: all 0.3s ease;
	}
	.theme-card:hover {
		border-color: var(--color-primary);
		background: var(--secondary-background);
		transform: translateY(-4px);
		box-shadow: 0 6px 16px rgba(94, 96, 206, 0.15);
	}
	.theme-card h3 {
		margin-bottom: 0.5rem;
		font-size: var(--font-size-h3);
		color: var(--color-text);
	}
	.theme-card p {
		font-size: var(--font-size);
		color: var(--color-text);
	}

	section.schools {
		padding: 4rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, rgba(72, 191, 227, 0.08) 0%, var(--color-background) 100%);
	}
	.schools h2 {
		font-size: var(--font-size-h2);
		margin-bottom: 1rem;
		color: var(--color-text);
	}
	.schools p {
		font-size: var(--font-size);
		margin-bottom: 1.5rem;
		color: var(--color-text);
	}

	footer {
		text-align: center;
		padding: 2rem 1rem;
		font-size: var(--font-size);
		border-top: var(--border-width) solid var(--border);
		background: var(--color-background);
		color: var(--color-text);
	}
</style>
