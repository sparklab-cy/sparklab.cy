<script lang="ts">
	import { onMount } from 'svelte';

	let year = new Date().getFullYear();

	type StoryBeat = {
		act: string;
		title: string;
		text: string;
	};

	type TeamMember = {
		name: string;
		role: string;
		bio: string;
		color: 'primary' | 'secondary' | 'tertiary';
	};

	const storyBeats: StoryBeat[] = [
		{
			act: 'Act I',
			title: 'The Question',
			text: 'Could electronics feel less like memorization and more like a real creative experience?',
		},
		{
			act: 'Act II',
			title: 'The First Prototype',
			text: 'Early modular kits proved learners moved faster when every lesson had a physical outcome.',
		},
		{
			act: 'Act III',
			title: 'Platform Meets Hardware',
			text: 'We connected lessons, code, and real builds into one flow: unlock, build, test, and iterate.',
		},
		{
			act: 'Act IV',
			title: 'Classroom Trials',
			text: 'Pilots with teachers shaped pacing, clarity, and collaboration until the system felt natural.',
		},
		{
			act: 'Act V',
			title: 'The Ongoing Story',
			text: 'ByteBlocks now grows with every builder who turns curiosity into a working project.',
		},
	];

	// TODO: Replace with real team details when ready.
	const team: TeamMember[] = [
		{
			name: 'Michalis Chatzittofi',
			role: 'CEO and Engineering Lead',
			bio: 'Leads product direction and engineering. Keeps every release aligned with real learner outcomes.',
			color: 'primary',
		},
		{
			name: 'Mariia Bivol',
			role: 'CMO',
			bio: 'Leads marketing and community. Handles customer support and feedback.',
			color: 'secondary',
		},
		{
			name: 'Anna Maria Vidouri',
			role: 'CFO',
			bio: 'Handles financials and operations. Ensures the company is financially sustainable and compliant.',
			color: 'tertiary',
		},
	];

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
	}

	onMount(() => {
		const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
		);

		revealElements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<div class="cinema">
	<section class="hero">
		<div class="hero-overlay"></div>
		<div class="hero-grain"></div>
		<div class="hero-inner reveal is-visible">
			<p class="eyebrow">The Story of ByteBlocks</p>
			<h1>Built Like a Learning Film</h1>
			<p class="lead">
				From first spark to classroom impact, ByteBlocks is designed as a sequence of moments:
				discover, build, test, and share.
			</p>
			<a class="hero-cta" href="/shop">Enter the Next Chapter</a>
		</div>
	</section>

	<section class="chapter intro reveal">
		<div class="chapter-inner">
			<h2>Opening Scene</h2>
			<p>
				We wanted electronics education to feel cinematic: high stakes, hands-on, and full of motion.
				Not just watching ideas, but building them with your own hands.
			</p>
		</div>
	</section>

	<section class="timeline reveal">
		<div class="section-title">
			<h2>Story Beats</h2>
			<p>How the project evolved, one act at a time.</p>
		</div>
		<div class="beats">
			{#each storyBeats as beat, idx}
				<article class="beat reveal" style="--delay: {idx * 90}ms;">
					<span class="act">{beat.act}</span>
					<h3>{beat.title}</h3>
					<p>{beat.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="team reveal">
		<div class="section-title">
			<h2>Main Cast</h2>
			<p>Three roles, one mission.</p>
		</div>
		<div class="team-grid">
			{#each team as member, idx}
				<article class="team-card c-{member.color} reveal" style="--delay: {idx * 110}ms;">
					<div class="avatar">{initials(member.name).toUpperCase()}</div>
					<h3>{member.name}</h3>
					<p class="role">{member.role}</p>
					<p class="bio">{member.bio}</p>
				</article>
			{/each}
		</div>
	</section>

	<footer class="site-footer">
		<div class="footer-inner">
			<img src="/logo.png" alt="" class="footer-logo" />
			<p>&copy; {year} ByteBlocks. All rights reserved.</p>
		</div>
	</footer>
</div>

<style>
	.cinema {
		position: relative;
	}

	.hero {
		position: relative;
		min-height: min(88vh, 860px);
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 5rem 2rem;
		overflow: hidden;
	}

	.hero::before {
		content: '';
		display: none;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: var(--mesh-bg);
		opacity: 0.34;
		z-index: 0;
	}

	.hero-grain {
		position: absolute;
		inset: -20%;
		background-image:
			radial-gradient(rgba(255, 255, 255, 0.06) 0.7px, transparent 0.7px);
		background-size: 3px 3px;
		mix-blend-mode: soft-light;
		opacity: 0.22;
		animation: grain-shift 9s steps(7) infinite;
		z-index: 0;
	}

	@keyframes grain-shift {
		0% { transform: translate(0, 0); }
		25% { transform: translate(-2%, 1%); }
		50% { transform: translate(1%, -1%); }
		75% { transform: translate(2%, 2%); }
		100% { transform: translate(0, 0); }
	}

	.hero-inner {
		position: relative;
		z-index: 1;
		max-width: 760px;
	}

	.eyebrow {
		margin: 0 0 0.8rem;
		font-size: 0.85rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		font-weight: 700;
		color: var(--color-primary);
	}

	h1 {
		margin: 0;
		font-size: clamp(2.3rem, 5vw, 4.4rem);
		line-height: 1.02;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.lead {
		margin: 1.2rem auto 0;
		max-width: 640px;
		color: var(--muted);
		font-size: 1rem;
		line-height: 1.8;
	}

	.hero-cta {
		display: inline-block;
		margin-top: 1.8rem;
		padding: 0.75rem 1.8rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--color-primary) 45%, var(--border));
		background: var(--color-primary);
		color: #fff;
		text-decoration: none;
		font-weight: 700;
		transition: transform 220ms ease, box-shadow 220ms ease;
	}

	.hero-cta:hover {
		transform: translateY(-1px);
		opacity: 0.9;
	}

	.chapter,
	.timeline,
	.team {
		max-width: 1100px;
		margin: 0 auto;
		padding: 4.2rem 2rem;
	}

	.chapter-inner {
		max-width: 760px;
		margin: 0 auto;
		padding: 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--secondary-background) 84%, transparent);
	}

	.chapter h2,
	.section-title h2 {
		margin: 0;
		font-size: var(--font-size-h2);
	}

	.chapter p,
	.section-title p {
		margin: 0.9rem 0 0;
		color: var(--muted);
		line-height: 1.75;
	}

	.section-title {
		text-align: center;
		margin-bottom: 2rem;
	}

	.beats {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.85rem;
	}

	.beat {
		padding: 1rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--secondary-background) 78%, transparent);
		position: relative;
		overflow: hidden;
	}

	.beat::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
		opacity: 0.6;
	}

	.act {
		display: inline-block;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-primary);
		font-weight: 700;
	}

	.beat h3 {
		margin: 0.45rem 0 0.4rem;
		font-size: 1rem;
	}

	.beat p {
		margin: 0;
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.55;
	}

	.team-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.team-card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--secondary-background) 78%, transparent);
		padding: 1.3rem;
		position: relative;
		overflow: hidden;
	}

	.team-card::before {
		content: '';
		position: absolute;
		inset: -40% -20% auto;
		height: 180px;
		background: radial-gradient(circle, rgba(116, 118, 252, 0.25), transparent 70%);
		opacity: 0.7;
	}

	.team-card.c-secondary::before {
		background: radial-gradient(circle, rgba(83, 144, 217, 0.25), transparent 70%);
	}

	.team-card.c-tertiary::before {
		background: radial-gradient(circle, rgba(72, 191, 227, 0.25), transparent 70%);
	}

	.avatar {
		position: relative;
		z-index: 1;
		width: 54px;
		height: 54px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-weight: 800;
		font-size: 0.9rem;
		color: var(--color-text);
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
	}

	.team-card h3 {
		position: relative;
		z-index: 1;
		margin: 0.9rem 0 0.2rem;
		font-size: 1.05rem;
	}

	.role {
		position: relative;
		z-index: 1;
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.team-card.c-secondary .role {
		color: var(--color-secondary);
	}

	.team-card.c-tertiary .role {
		color: var(--color-tertiary);
	}

	.bio {
		position: relative;
		z-index: 1;
		margin: 0.7rem 0 0;
		color: var(--muted);
		line-height: 1.65;
		font-size: 0.9rem;
	}

	.site-footer {
		padding: 2rem;
		border-top: 1px solid var(--border);
		background: color-mix(in srgb, var(--secondary-background) 85%, transparent);
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
		opacity: 0.55;
	}

	.footer-inner p {
		margin: 0;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.reveal {
		opacity: 0;
		transform: translateY(34px) scale(0.985);
		filter: blur(5px);
		transition:
			opacity 720ms ease,
			transform 720ms ease,
			filter 720ms ease;
		transition-delay: var(--delay, 0ms);
	}

	.reveal.is-visible {
		opacity: 1;
		transform: translateY(0) scale(1);
		filter: blur(0);
	}

	@media (max-width: 980px) {
		.beats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.team-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.hero {
			min-height: auto;
			padding: 4rem 1.25rem;
		}

		.chapter,
		.timeline,
		.team {
			padding: 3.3rem 1.25rem;
		}

		.beats {
			grid-template-columns: 1fr;
		}
	}
</style>
