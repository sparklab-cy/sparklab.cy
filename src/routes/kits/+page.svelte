<script lang="ts">
	type KitCard = {
		title: string;
		description: string;
		image: string;
		tags: string[];
		status?: 'current' | 'coming';
	};

	// TODO: Replace these with your real kit names/images/descriptions.
	const currentKits: KitCard[] = [
		{
			title: 'Starter Circuits Kit',
			description: 'A beginner-friendly kit to learn the basics: power, LEDs, buttons, and simple sensors.',
			image: '/default-kit-image.jpg',
			tags: ['Level 1', 'Basics', 'Hands-on'],
			status: 'current',
		},
		{
			title: 'Motion and Light Kit',
			description: 'Build interactive projects using motion detection and light control with modular components.',
			image: '/default-kit-image.jpg',
			tags: ['Level 2', 'Sensors', 'Creative builds'],
			status: 'current',
		},
	];

	const comingKits: KitCard[] = [
		{
			title: 'Smart Home Mini Kit',
			description: 'Explore automation with switches, relays, and simple IoT-style interactions.',
			image: '/default-kit-image.jpg',
			tags: ['Coming Soon', 'Home Tech', 'Automation'],
			status: 'coming',
		},
		{
			title: 'Robot Rover Kit',
			description: 'Learn motion, control, and feedback with a small rover build and guided challenges.',
			image: '/default-kit-image.jpg',
			tags: ['Coming Soon', 'Robotics', 'Control'],
			status: 'coming',
		},
		{
			title: 'Sound and Music Kit',
			description: 'Turn code into sound: buzzers, tones, patterns, and interactive music projects.',
			image: '/default-kit-image.jpg',
			tags: ['Coming Soon', 'Audio', 'Creative'],
			status: 'coming',
		},
		{
			title: 'Environment Lab Kit',
			description: 'Measure temperature, humidity, and more, then visualize your data and learn calibration.',
			image: '/default-kit-image.jpg',
			tags: ['Coming Soon', 'Data', 'Environment'],
			status: 'coming',
		},
		{
			title: 'Wearables Kit',
			description: 'Build light-up, responsive wearables with safe power, compact modules, and fun patterns.',
			image: '/default-kit-image.jpg',
			tags: ['Coming Soon', 'Wearables', 'Design'],
			status: 'coming',
		},
	];
</script>

<div class="kits-page">
	<header class="kits-hero animate-in">
		<h1>Kits</h1>
		<p>
			Modular electronics kits designed to feel creative and cinematic: build, test, iterate, and share.
		</p>
	</header>

	<section class="kits-section">
		<div class="section-head">
			<h2>Current Kits</h2>
			<p>Available now. Each kit includes guided builds and interactive learning.</p>
		</div>

		<div class="kits-grid">
			{#each currentKits as kit, i}
				<article class="kit-card animate-in delay-{i + 1}">
					<div class="kit-image">
						<img src={kit.image} alt={kit.title} />
					</div>
					<div class="kit-body">
						<h3>{kit.title}</h3>
						<p class="kit-desc">{kit.description}</p>
						<div class="tags">
							{#each kit.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="kits-section muted">
		<div class="section-head">
			<h2>Coming Kits</h2>
			<p>In production. These kits are on the way.</p>
		</div>

		<div class="kits-grid">
			{#each comingKits as kit, i}
				<article class="kit-card coming animate-in delay-{i + 1}">
					<div class="kit-image">
						<img src={kit.image} alt={kit.title} />
						<div class="badge">Coming</div>
					</div>
					<div class="kit-body">
						<h3>{kit.title}</h3>
						<p class="kit-desc">{kit.description}</p>
						<div class="tags">
							{#each kit.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>
</div>

<style>
	.kits-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2.5rem 2rem 4rem;
	}

	.kits-hero {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.kits-hero h1 {
		margin: 0 0 0.75rem;
		font-size: var(--font-size-h1);
		color: var(--color-text);
	}

	.kits-hero p {
		margin: 0 auto;
		max-width: 720px;
		color: var(--muted);
		line-height: 1.8;
		font-size: 1rem;
	}

	.kits-section {
		margin-top: 3rem;
	}

	.kits-section.muted {
		padding-top: 3rem;
		border-top: 1px solid var(--border);
	}

	.section-head {
		text-align: center;
		margin-bottom: 1.75rem;
	}

	.section-head h2 {
		margin: 0 0 0.5rem;
		font-size: var(--font-size-h2);
		color: var(--color-text);
	}

	.section-head p {
		margin: 0 auto;
		max-width: 760px;
		color: var(--muted);
		line-height: 1.7;
	}

	.kits-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.kit-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--secondary-background);
		transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
	}

	.kit-card:hover {
		transform: translateY(-3px);
		border-color: color-mix(in srgb, var(--color-primary) 55%, var(--border));
		box-shadow: 0 14px 36px rgba(116, 118, 252, 0.14);
	}

	.kit-image {
		position: relative;
		height: 190px;
		background: var(--color-background);
	}

	.kit-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: saturate(1.02) contrast(1.02);
	}

	.badge {
		position: absolute;
		top: 12px;
		left: 12px;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-accent) 65%, transparent);
		color: #fff;
		font-weight: 800;
		font-size: 0.75rem;
		letter-spacing: 0.03em;
		border: 1px solid rgba(255, 255, 255, 0.14);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}

	.kit-body {
		padding: 1.25rem 1.15rem 1.35rem;
	}

	.kit-body h3 {
		margin: 0 0 0.5rem;
		color: var(--color-text);
		font-size: var(--font-size-h3);
	}

	.kit-desc {
		margin: 0 0 0.9rem;
		color: var(--muted);
		line-height: 1.7;
		font-size: 0.92rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--border) 85%, transparent);
		background: color-mix(in srgb, var(--color-background) 70%, transparent);
		color: var(--color-text);
		font-size: 0.78rem;
		font-weight: 700;
		opacity: 0.92;
	}

	@media (max-width: 980px) {
		.kits-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.kits-page {
			padding: 2rem 1.25rem 3rem;
		}

		.kits-grid {
			grid-template-columns: 1fr;
		}

		.kit-image {
			height: 180px;
		}
	}
</style>
