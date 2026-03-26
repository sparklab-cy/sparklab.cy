<script lang="ts">
	type KitComponent = {
		name: string;
	};

	type KitCard = {
		title: string;
		description: string;
		image?: string;
		tags: string[];
		status?: 'current' | 'coming';
		components?: string[];
		extras?: string[];
	};

	const currentKits: KitCard[] = [
		{
			title: 'Color Mixer',
			description: 'Mix any color with 3 knobs controlling an RGB LED. Each potentiometer adjusts the intensity of one color channel (red, green, blue) so you can dial in any shade.',
			image: undefined,
			tags: ['Level 1', 'RGB', 'No Code'],
			status: 'current',
			components: [
				'RGB LED',
				'3x Potentiometer',
				'3x Resistor',
				'3x AA Battery Holder',
			],
			extras: ['Extra resistors to experiment with'],
		},
		{
			title: 'Smart Nightlight',
			description: 'A motion-activated nightlight powered by Arduino. A PIR sensor detects movement and switches on a 3W LED, all housed in a 3D-printed case.',
			image: undefined,
			tags: ['Level 2', 'Arduino', 'Motion Sensor'],
			status: 'current',
			components: [
				'3W LED',
				'PIR Motion Sensor',
				'Arduino R3',
				'3D Printed Casing',
				'Jumper Cables',
			],
			extras: ['No custom PCB — wired with jumper cables'],
		},
	];

	const comingKits: KitCard[] = [
		{
			title: 'Smart Home Mini Kit',
			description: 'Explore automation with switches, relays, and simple IoT-style interactions.',
			image: undefined,
			tags: ['Coming Soon', 'Home Tech', 'Automation'],
			status: 'coming',
		},
		{
			title: 'Robot Rover Kit',
			description: 'Learn motion, control, and feedback with a small rover build and guided challenges.',
			image: undefined,
			tags: ['Coming Soon', 'Robotics', 'Control'],
			status: 'coming',
		},
		{
			title: 'Sound and Music Kit',
			description: 'Turn code into sound: buzzers, tones, patterns, and interactive music projects.',
			image: undefined,
			tags: ['Coming Soon', 'Audio', 'Creative'],
			status: 'coming',
		},
		{
			title: 'Environment Lab Kit',
			description: 'Measure temperature, humidity, and more, then visualize your data and learn calibration.',
			image: undefined,
			tags: ['Coming Soon', 'Data', 'Environment'],
			status: 'coming',
		},
		{
			title: 'Wearables Kit',
			description: 'Build light-up, responsive wearables with safe power, compact modules, and fun patterns.',
			image: undefined,
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

		<div class="kits-grid kits-grid-current">
			{#each currentKits as kit, i}
				<article class="kit-card animate-in delay-{i + 1}">
					{#if kit.image}
						<div class="kit-image">
							<img src={kit.image} alt={kit.title} />
						</div>
					{/if}
					<div class="kit-body">
						<h3>{kit.title}</h3>
						<p class="kit-desc">{kit.description}</p>
						<div class="tags">
							{#each kit.tags as tag}
								<span class="tag">{tag}</span>
							{/each}
						</div>

						{#if kit.components && kit.components.length > 0}
							<div class="components">
								<h4>What's in the box</h4>
								<ul>
									{#each kit.components as comp}
										<li>
											<span class="comp-name">{comp}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if kit.extras && kit.extras.length > 0}
							<div class="extras">
								{#each kit.extras as extra}
									<span class="extra">{extra}</span>
								{/each}
							</div>
						{/if}
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
					{#if kit.image}
						<div class="kit-image">
							<img src={kit.image} alt={kit.title} />
							<div class="badge">Coming</div>
						</div>
					{/if}
					<div class="kit-body">
						{#if !kit.image}
							<div class="badge badge-body">Coming</div>
						{/if}
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

	.kits-grid-current {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.kit-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--secondary-background);
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

	.badge.badge-body {
		position: relative;
		top: auto;
		left: auto;
		margin: 0 0 0.95rem;
		display: inline-block;
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

	.components {
		margin-top: 1.1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(128, 128, 128, 0.12);
	}

	.components h4 {
		margin: 0 0 0.55rem;
		font-size: 0.82rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		font-weight: 800;
	}

	.components ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.components li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.88rem;
		color: var(--color-text);
	}

	.comp-name {
		font-weight: 600;
	}

	.comp-price {
		font-weight: 800;
		color: var(--color-primary);
		font-size: 0.85rem;
	}

	.extras {
		margin-top: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.extra {
		font-size: 0.82rem;
		color: var(--muted);
		line-height: 1.5;
		font-weight: 600;
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
