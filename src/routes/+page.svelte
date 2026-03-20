<script lang="ts">
	const year = new Date().getFullYear();

	const tickerItems = [
		'Lorem ipsum dolor sit amet',
		'Consectetur adipiscing elit',
		'Sed do eiusmod tempor incididunt',
		'Ut labore et dolore magna aliqua',
		'Quis nostrud exercitation ullamco',
		'Duis aute irure dolor in reprehenderit',
		'Excepteur sint occaecat cupidatat',
		'Sunt in culpa qui officia deserunt',
	];

	const bentoCards = [
		{ title: 'Modular Hardware', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.', span: 'wide', color: 'primary', icon: 'circuit' },
		{ title: '5 Difficulty Levels', body: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.', span: 'normal', color: 'secondary', icon: 'levels' },
		{ title: 'Interactive Lessons', body: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.', span: 'normal', color: 'tertiary', icon: 'lesson' },
		{ title: 'Classroom Ready', body: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.', span: 'normal', color: 'primary', icon: 'classroom' },
		{ title: 'Community Courses', body: 'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.', span: 'wide', color: 'accent', icon: 'community' },
	];

	function handleBlobMove(event: MouseEvent) {
		const card = (event.currentTarget as HTMLElement);
		const rect = card.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		card.style.setProperty('--blob-x', `${x}px`);
		card.style.setProperty('--blob-y', `${y}px`);
	}

	function handleBlobEnter(event: MouseEvent) {
		const card = (event.currentTarget as HTMLElement);
		card.classList.add('blob-active');
		handleBlobMove(event);
	}

	function handleBlobLeave(event: MouseEvent) {
		const card = (event.currentTarget as HTMLElement);
		card.classList.remove('blob-active');
	}

	import { onMount } from 'svelte';

	let tickerTrack: HTMLElement;
	let tickerOffset = 0;
	let tickerSpeed = 0.35;
	let tickerTargetSpeed = 0.35;
	let tickerRaf: number;
	const speedUpMultriplier = 0.05;

	function tickerLoop() {
		tickerSpeed += (tickerTargetSpeed - tickerSpeed) * speedUpMultriplier;
		tickerOffset -= tickerSpeed;

		if (tickerTrack) {
			const halfWidth = tickerTrack.scrollWidth / 2;
			if (Math.abs(tickerOffset) >= halfWidth) {
				tickerOffset += halfWidth;
			}
			tickerTrack.style.transform = `translateX(${tickerOffset}px)`;
		}

		tickerRaf = requestAnimationFrame(tickerLoop);
	}

	onMount(() => {
		tickerRaf = requestAnimationFrame(tickerLoop);
		return () => cancelAnimationFrame(tickerRaf);
	});
</script>

<!-- Scrolling ticker -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="ticker"
	role="marquee"
	onmouseenter={() => tickerTargetSpeed = 0}
	onmouseleave={() => tickerTargetSpeed = 0.5}
>
	<div class="ticker-track" bind:this={tickerTrack}>
		{#each [...tickerItems, ...tickerItems] as item}
			<span class="ticker-item">{item}</span>
			<span class="ticker-dot"></span>
		{/each}
	</div>
</div>

<!-- Hero -->
<section class="hero">
	<div class="hero-inner animate-in">
		<img src="/logo_no_bg_colored.png" alt="ByteBlocks logo" class="hero-logo" />
		<p class="hero-tagline">Spark Curiosity. Build the Future.</p>
		<p class="hero-sub">
			Hands-on modular electronics kits paired with an interactive online platform.
			Pick your level, learn at your pace — solo or in a classroom.
		</p>
		<a href="/shop" class="hero-cta">Explore Kits</a>
	</div>
</section>

<!-- Bento grid -->
<section class="bento-section">
	<div class="bento-container">
		{#each bentoCards as card}
			<div
				class="bento-card {card.span} c-{card.color}"
				role="presentation"
				onmousemove={handleBlobMove}
				onmouseenter={handleBlobEnter}
				onmouseleave={handleBlobLeave}
			>
				<div class="bento-blob"></div>
				<div class="bento-content">
					<div class="bento-icon">
						{#if card.icon === 'circuit'}
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="18" y="18" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2.5"/>
								<line x1="24" y1="6" x2="24" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<line x1="24" y1="30" x2="24" y2="42" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<line x1="6" y1="24" x2="18" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<line x1="30" y1="24" x2="42" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<circle cx="24" cy="6" r="3" fill="currentColor"/>
								<circle cx="24" cy="42" r="3" fill="currentColor"/>
								<circle cx="6" cy="24" r="3" fill="currentColor"/>
								<circle cx="42" cy="24" r="3" fill="currentColor"/>
							</svg>
						{:else if card.icon === 'levels'}
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="6" y="32" width="8" height="10" rx="2" fill="currentColor" opacity="0.3"/>
								<rect x="16" y="26" width="8" height="16" rx="2" fill="currentColor" opacity="0.5"/>
								<rect x="26" y="18" width="8" height="24" rx="2" fill="currentColor" opacity="0.7"/>
								<rect x="36" y="10" width="8" height="32" rx="2" fill="currentColor" opacity="0.9"/>
							</svg>
						{:else if card.icon === 'lesson'}
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" stroke-width="2.5"/>
								<line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<line x1="16" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<line x1="16" y1="32" x2="24" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
							</svg>
						{:else if card.icon === 'classroom'}
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="24" cy="14" r="6" stroke="currentColor" stroke-width="2.5"/>
								<path d="M12 38c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
								<circle cx="10" cy="18" r="4" stroke="currentColor" stroke-width="2" opacity="0.5"/>
								<circle cx="38" cy="18" r="4" stroke="currentColor" stroke-width="2" opacity="0.5"/>
							</svg>
						{:else}
							<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M24 6L42 18V38L24 42L6 38V18L24 6Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
								<circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2.5"/>
								<line x1="24" y1="6" x2="24" y2="18" stroke="currentColor" stroke-width="2" opacity="0.4"/>
								<line x1="6" y1="18" x2="18" y2="24" stroke="currentColor" stroke-width="2" opacity="0.4"/>
								<line x1="42" y1="18" x2="30" y2="24" stroke="currentColor" stroke-width="2" opacity="0.4"/>
							</svg>
						{/if}
					</div>
					<h3>{card.title}</h3>
					<p>{card.body}</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- How it works (with SVG illustrations and connector) -->
<section class="how-it-works">
	<div class="how-container">
		<h2 class="sec-heading animate-in">How It Works</h2>

		<div class="steps-row">
			{#each [
				{ n: '1', t: 'Pick a Kit', d: 'Choose a color-coded kit by theme and level (1-5). Each one comes with real components.', svg: 'M12 4h24v32H12zM20 12h8M20 18h8M20 24h4M8 20l4-4 4 4M32 20l4-4 4 4' },
				{ n: '2', t: 'Scan & Unlock', d: 'Scan the code included with your kit to unlock interactive lessons and build instructions.', svg: 'M8 8h12v12H8zM28 8h12v12H28zM8 28h12v12H8zM28 28h12v12H28zM24 14v20M14 24h20' },
				{ n: '3', t: 'Build & Code', d: 'Assemble circuits, upload code, and see your project come alive on real hardware.', svg: 'M10 38L24 10l14 28M18 28h12M6 24c0-10 8-18 18-18M42 24c0-10-8-18-18-18' },
				{ n: '4', t: 'Learn Together', d: 'Progress solo or in class. Teachers can release lessons over time at their own pace.', svg: 'M24 12a6 6 0 100 12 6 6 0 000-12zM12 40c0-6.6 5.4-12 12-12s12 5.4 12 12M6 14l6 6 6-6M36 14l-6 6-6-6' },
			] as step, i}
				{#if i > 0}
					<div class="step-connector">
						<svg viewBox="0 0 40 8" class="connector-svg">
							<line x1="0" y1="4" x2="40" y2="4" stroke="var(--color-primary)" stroke-width="2" stroke-dasharray="4 4" opacity="0.35" class="connector-line"/>
						</svg>
					</div>
				{/if}
				<div class="step-card animate-in delay-{i + 1}">
					<div class="step-illustration">
						<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d={step.svg} stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
						</svg>
					</div>
					<span class="step-num">{step.n}</span>
					<h3>{step.t}</h3>
					<p>{step.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- For schools -->
<section class="schools">
	<div class="schools-container schools-inner">
		<h2 class="sec-heading animate-in">For Schools & Educators</h2>
		<p class="schools-desc animate-in delay-1">
			ByteBlocks kits include teacher dashboards, classroom progress tracking,
			per-student lesson control, and fully editable course content — designed
			for structured learning environments across Europe.
		</p>
		<a href="/shop" class="schools-cta animate-in delay-2">Learn More</a>
	</div>
</section>

<!-- Footer -->
<footer class="site-footer">
	<div class="footer-inner">
		<img src="/logo.png" alt="" class="footer-logo" />
		<p>&copy; {year} ByteBlocks. All rights reserved.</p>
	</div>
</footer>

<style>
	/* ── Scrolling ticker ─────────────────────────── */
	.ticker {
		overflow: hidden;
		background: var(--secondary-background);
		border-bottom: 1px solid var(--border);
		padding: 0.55rem 0;
		white-space: nowrap;
	}

	.ticker-track {
		display: inline-flex;
		align-items: center;
		gap: 0;
		will-change: transform;
	}

	.ticker-item {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--muted);
		letter-spacing: 0.02em;
		padding: 0 1rem;
		flex-shrink: 0;
	}

	.ticker-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-primary);
		opacity: 0.5;
		flex-shrink: 0;
	}

	/* scroll-left animation removed — ticker is JS-driven for smooth hover pause */

	/* ── Hero ─────────────────────────────────────── */
	.hero {
		padding: 6rem 2rem 4rem;
		text-align: center;
	}

	.hero-inner { max-width: 580px; margin: 0 auto; }

	.hero-logo {
		width: 250px;
		height: auto;
		margin-bottom: 1.25rem;
		border-radius: 10px;
		/* filter: drop-shadow(0 0 18px rgba(200, 200, 255, 0.05)) drop-shadow(0 0 6px rgba(116, 118, 252, 0.1)); */
	}

	.hero-tagline {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0 0 0.75rem;
	}

	.hero-sub {
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--muted);
		margin: 0 auto 2rem;
		max-width: 480px;
	}

	.hero-cta {
		display: inline-block;
		padding: 0.7rem 2rem;
		background: var(--color-primary);
		color: #fff;
		border-radius: 100px;
		text-decoration: none;
		font-weight: 700;
		font-size: 0.95rem;
		transition: transform 0.15s ease, opacity 0.15s ease;
	}

	.hero-cta:hover {
		transform: translateY(-1px);
		opacity: 0.9;
	}

	/* ── Bento grid ───────────────────────────────── */
	.bento-section {
		padding: 2rem 0 4rem;
	}

	.bento-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 2rem;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-auto-rows: auto;
		gap: 1rem;
	}

	.bento-card {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--secondary-background);
		padding: 2rem 1.5rem;
		cursor: default;
		--blob-x: 50%;
		--blob-y: 50%;
	}

	.bento-card.wide {
		grid-column: span 2;
	}

	/* Blob follower */
	.bento-blob {
		position: absolute;
		width: 180px;
		height: 180px;
		border-radius: 50%;
		pointer-events: none;
		top: var(--blob-y);
		left: var(--blob-x);
		transform: translate(-50%, -50%);
		filter: blur(60px);
		opacity: 0;
		transition: opacity 0.35s ease;
		z-index: 0;
	}

	:global(.blob-active) .bento-blob {
		opacity: 1;
	}

	.c-primary .bento-blob   { background: rgba(116, 118, 252, 0.25); }
	.c-secondary .bento-blob { background: rgba(83, 144, 217, 0.25); }
	.c-tertiary .bento-blob  { background: rgba(72, 191, 227, 0.25); }
	.c-accent .bento-blob    { background: rgba(116, 0, 184, 0.2); }

	.bento-content {
		position: relative;
		z-index: 1;
	}

	.bento-icon {
		width: 44px;
		height: 44px;
		margin-bottom: 1rem;
	}

	.bento-icon svg {
		width: 100%;
		height: 100%;
	}

	.c-primary .bento-icon   { color: var(--color-primary); }
	.c-secondary .bento-icon { color: var(--color-secondary); }
	.c-tertiary .bento-icon  { color: var(--color-tertiary); }
	.c-accent .bento-icon    { color: var(--color-accent); }

	.bento-card h3 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.bento-card p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--muted);
		line-height: 1.6;
	}

	/* ── How it works ─────────────────────────────── */
	.how-it-works {
		padding: 4rem 0;
		background: var(--secondary-background);
	}

	.how-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.sec-heading {
		font-size: var(--font-size-h2);
		text-align: center;
		margin: 0 0 2.5rem;
		color: var(--color-text);
	}

	.steps-row {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 0;
	}

	.step-connector {
		display: flex;
		align-items: center;
		padding-top: 3.5rem;
		flex-shrink: 0;
	}

	.connector-svg {
		width: 40px;
		height: 8px;
		overflow: visible;
	}

	.connector-svg .connector-line {
		animation: dash-flow 0.8s linear infinite;
	}

	@keyframes dash-flow {
		0%   { stroke-dashoffset: 8; }
		100% { stroke-dashoffset: 0; }
	}

	.step-card {
		position: relative;
		flex: 1;
		max-width: 220px;
		padding: 1.25rem 1rem;
		text-align: center;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--color-background);
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.step-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-primary);
	}

	.step-illustration {
		width: 56px;
		height: 56px;
		margin: 0 auto 0.75rem;
		opacity: 0.7;
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.step-card:hover .step-illustration {
		opacity: 1;
		transform: scale(1.08);
	}

	.step-illustration svg {
		width: 100%;
		height: 100%;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--color-primary);
		color: #fff;
		font-weight: 800;
		font-size: 0.75rem;
		margin-bottom: 0.4rem;
	}

	.step-card h3 {
		margin: 0 0 0.35rem;
		font-size: 0.9rem;
		color: var(--color-text);
	}

	.step-card p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
		line-height: 1.5;
	}

	/* ── Schools ──────────────────────────────────── */
	.schools {
		padding: 3.5rem 0;
		background: var(--color-background);
	}

	.schools-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.schools-inner {
		text-align: center;
		max-width: 560px;
		margin: 0 auto;
	}

	.schools-desc {
		font-size: 0.95rem;
		line-height: 1.7;
		color: var(--muted);
		margin: 0 0 1.5rem;
	}

	.schools-cta {
		display: inline-block;
		padding: 0.65rem 1.75rem;
		border: 2px solid var(--color-primary);
		border-radius: 100px;
		text-decoration: none;
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--color-primary);
		transition: background 0.15s ease, color 0.15s ease;
	}

	.schools-cta:hover {
		background: var(--color-primary);
		color: #fff;
	}

	/* ── Footer ───────────────────────────────────── */
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

	/* ── Responsive ───────────────────────────────── */
	@media (max-width: 900px) {
		.bento-container {
			grid-template-columns: repeat(2, 1fr);
		}
		.bento-card.wide { grid-column: span 2; }

		.steps-row {
			flex-wrap: wrap;
			gap: 1.5rem;
		}
		.step-connector { display: none; }
		.step-card { max-width: 100%; }
	}

	@media (max-width: 600px) {
		.hero { padding: 4rem 1.5rem 3rem; }
		.bento-container {
			grid-template-columns: 1fr;
		}
		.bento-card.wide { grid-column: span 1; }

		.steps-row {
			flex-direction: column;
			align-items: center;
		}
	}
</style>
