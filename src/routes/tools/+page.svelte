<script lang="ts">
	type ToolItem = {
		name: string;
		tag: string;
		description: string;
		features: string[];
	};

	const tools: ToolItem[] = [
		{
			name: 'ByteBlocks Studio',
			tag: 'Programming',
			description:
				'Program Arduino-compatible kits with an intuitive Scratch-style block editor designed for fast learning and real hardware control.',
			features: ['Scratch blocks for Arduino', 'Beginner-friendly flow', 'Real hardware upload'],
		},
		{
			name: 'ByteBlocks IoT Dashboard',
			tag: 'Cloud',
			description:
				'A simple IoT platform for monitoring devices, visualizing data, and managing connected kit projects from one place.',
			features: ['Live device telemetry', 'Simple widgets and charts', 'Device monitoring overview'],
		},
		{
			name: 'Virtual Circuit Simulator',
			tag: 'Simulation',
			description:
				'A web tool that lets users wire, code, and test setups virtually before assembling physical kits.',
			features: ['Virtual wiring canvas', 'Code-and-test workflow', 'Safer pre-build validation'],
		},
		{
			name: 'Companion Mobile App',
			tag: 'Mobile',
			description:
				'A customizable mobile app to control IoT devices via Bluetooth and view sensor data while on the go.',
			features: ['Bluetooth device control', 'Mobile sensor views', 'Custom control layouts'],
		},
		{
			name: 'Educator Portal',
			tag: 'Education',
			description:
				'A dedicated teacher space with structured lesson plans, auto-grading for kit challenges, and classroom progress tracking.',
			features: ['Structured lesson plans', 'Auto-grading workflows', 'Class progress tracking'],
		},
		{
			name: 'OTA Fleet Manager',
			tag: 'Advanced',
			description:
				'A deployment tool for advanced users to push firmware updates over-the-air to multiple IoT devices remotely.',
			features: ['Remote firmware deployment', 'Multi-device rollout', 'Fleet update visibility'],
		},
	];
</script>

<section class="tools-hero">
	<div class="hero-inner animate-in">
		<p class="eyebrow">Tools</p>
		<h1>Build, code, test, and deploy</h1>
		<p class="hero-sub">
			The ByteBlocks toolset covers the full maker workflow: from beginner block programming to advanced IoT fleet updates.
		</p>
	</div>
</section>

<section class="tools-section">
	<div class="tools-container">
		<div class="tools-grid">
			{#each tools as tool, idx}
				<article class="tool-card animate-in delay-{(idx % 5) + 1}">
					<div class="tool-head">
						<h2>{tool.name}</h2>
						<span class="tool-tag">{tool.tag}</span>
					</div>
					<p class="tool-description">{tool.description}</p>
					<ul class="feature-list">
						{#each tool.features as feature}
							<li>{feature}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</div>
</section>

<style>
	.tools-hero {
		padding: 5.5rem 2rem 2.5rem;
		text-align: center;
	}

	.hero-inner {
		max-width: 760px;
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

	.tools-hero h1 {
		margin: 0;
		font-size: clamp(2.1rem, 4.8vw, 3.8rem);
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: var(--color-text);
	}

	.hero-sub {
		margin: 1rem auto 0;
		max-width: 650px;
		color: var(--muted);
		line-height: 1.8;
		font-size: 1rem;
	}

	.tools-section {
		padding: 1.5rem 0 4.5rem;
	}

	.tools-container {
		max-width: 1140px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.tools-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.tool-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--secondary-background) 82%, transparent);
		padding: 1.25rem 1.2rem 1.3rem;
	}

	.tool-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.7rem;
	}

	.tool-head h2 {
		margin: 0;
		font-size: 1.15rem;
		color: var(--color-text);
	}

	.tool-tag {
		border: 1px solid color-mix(in srgb, var(--color-primary) 45%, var(--border));
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
		border-radius: 999px;
		padding: 0.24rem 0.58rem;
		font-weight: 800;
		font-size: 0.74rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.tool-description {
		margin: 0 0 0.85rem;
		color: var(--muted);
		line-height: 1.7;
		font-size: 0.93rem;
	}

	.feature-list {
		margin: 0;
		padding-left: 1.2rem;
		color: var(--color-text);
		display: grid;
		gap: 0.35rem;
	}

	.feature-list li {
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--muted);
	}

	@media (max-width: 900px) {
		.tools-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.tools-hero {
			padding: 4.5rem 1.25rem 2rem;
		}

		.tools-container {
			padding: 0 1.25rem;
		}
	}
</style>
