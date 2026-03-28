<script lang="ts">
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import type { CustomCourse, Lesson, LessonFile, OfficialCourse, UserProgress } from '$lib/types/courses';

	const { data } = $props();
	const { course, userProgress, error, courseKind } = data;

	const lessons = $derived<Lesson[]>(data.lessons ?? []);
	const lessonFilesMap = $derived<Record<string, LessonFile[]>>(data.lessonFilesMap ?? {});

	let selectedLessonId = $state<string | null>(null);
	let activeTabIndex = $state(0);

	let markdownCache = $state<Record<string, string>>({});
	let markdownLoading = $state(false);

	const selectedLesson = $derived(lessons.find((l) => l.id === selectedLessonId) ?? null);
	const selectedFiles = $derived(
		selectedLessonId ? (lessonFilesMap[selectedLessonId] ?? []) : []
	);
	const activeFile = $derived(selectedFiles[activeTabIndex] ?? null);

	$effect(() => {
		const first = lessons[0]?.id ?? null;
		if (selectedLessonId === null && first) selectedLessonId = first;
		else if (selectedLessonId && !lessons.some((l) => l.id === selectedLessonId)) {
			selectedLessonId = first;
		}
	});

	$effect(() => {
		selectedLessonId;
		activeTabIndex = 0;
	});

	$effect(() => {
		const f = activeFile;
		if (f?.file_type === 'markdown' && !markdownCache[f.id]) {
			markdownLoading = true;
			fetch(storageUrl(f.storage_path))
				.then((r) => r.text())
				.then(async (text) => {
					const { marked } = await import('marked');
					markdownCache = { ...markdownCache, [f.id]: await marked.parse(text) };
				})
				.catch(() => {
					markdownCache = { ...markdownCache, [f.id]: '<p>Failed to load content.</p>' };
				})
				.finally(() => (markdownLoading = false));
		}
	});

	function storageUrl(path: string): string {
		return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesson-files/${path}`;
	}

	function fileTypeIcon(type: LessonFile['file_type']): string {
		if (type === 'markdown') return '📄';
		if (type === 'video') return '▶';
		return '⚡';
	}

	function getLessonStatus(lessonId: string): 'not_started' | 'in_progress' | 'completed' {
		const progress = userProgress.find((p: UserProgress) => p.lesson_id === lessonId);
		return progress?.status || 'not_started';
	}

	function getProgressPercentage(): number {
		if (lessons.length === 0) return 0;
		const completed = userProgress.filter((p: UserProgress) => p.status === 'completed').length;
		return Math.round((completed / lessons.length) * 100);
	}

	const customCourse = $derived(
		courseKind === 'custom' && course
			? (course as CustomCourse & { creator?: { full_name: string | null } })
			: null
	);
	const officialCourse = $derived(courseKind === 'official' && course ? (course as OfficialCourse) : null);
</script>

<div class="viewer-shell">
	{#if error}
		<div class="error-state">
			<p class="banner-error">{error}</p>
			<a href="/courses" class="back-link-inline">← My Courses</a>
		</div>
	{:else if course}
		<header class="viewer-header">
			<a href="/courses" class="back-link">← My Courses</a>
			<div class="header-center">
				<h1 class="course-title">{course.title}</h1>
				<p class="course-desc">{course.description}</p>
				{#if customCourse}
					<span class="meta-line"
						>By {customCourse.creator?.full_name ?? 'Teacher'}</span
					>
				{:else if officialCourse}
					<span class="meta-line"
						>{officialCourse.theme} · Level {officialCourse.level}</span
					>
				{/if}
			</div>
			<div class="header-right">
				<div class="progress-bar-wrap" aria-label="Course progress">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {getProgressPercentage()}%"></div>
					</div>
					<span class="progress-pct">{getProgressPercentage()}%</span>
				</div>
			</div>
		</header>

		<div class="viewer-body">
			<aside class="viewer-sidebar">
				<div class="sidebar-header">
					<span class="sidebar-title">Lessons</span>
				</div>
				<nav class="lessons-nav">
					{#if lessons.length === 0}
						<p class="no-lessons">No lessons available yet.</p>
					{:else}
						{#each lessons as lesson, i}
							<div
								class="lesson-nav-item"
								class:active={lesson.id === selectedLessonId}
							>
								<button
									type="button"
									class="lesson-nav-btn"
									onclick={() => (selectedLessonId = lesson.id)}
								>
									<span class="lesson-nav-num">{i + 1}</span>
									<span class="lesson-nav-title">{lesson.title}</span>
									{#if getLessonStatus(lesson.id) === 'completed'}
										<span class="prog-dot done" title="Completed">✓</span>
									{:else if getLessonStatus(lesson.id) === 'in_progress'}
										<span class="prog-dot progress" title="In progress">◐</span>
									{:else}
										<span class="prog-dot todo" title="Not started">○</span>
									{/if}
								</button>
							</div>
						{/each}
					{/if}
				</nav>
			</aside>

			<main class="viewer-main">
				{#if selectedLesson}
					<div class="tab-bar">
						{#each selectedFiles as file, i}
							<button
								type="button"
								class="tab-btn"
								class:active={i === activeTabIndex}
								onclick={() => (activeTabIndex = i)}
								role="tab"
								aria-selected={i === activeTabIndex}
							>
								<span class="tab-icon">{fileTypeIcon(file.file_type)}</span>
								<span class="tab-name">{file.file_name}</span>
							</button>
						{/each}
					</div>

					<div class="tab-content">
						{#if selectedFiles.length === 0}
							<div class="empty-tab">
								<p>No lesson content has been added for this lesson yet.</p>
							</div>
						{:else if activeFile}
							{#if activeFile.file_type === 'markdown'}
								{#if markdownLoading && !markdownCache[activeFile.id]}
									<div class="loading">Loading…</div>
								{:else}
									<div class="markdown-preview">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html markdownCache[activeFile.id] ?? ''}
									</div>
								{/if}
							{:else if activeFile.file_type === 'video'}
								<div class="video-wrapper">
									<!-- svelte-ignore a11y_media_has_caption -->
									<video
										controls
										src={storageUrl(activeFile.storage_path)}
										class="preview-video"
									></video>
								</div>
							{:else if activeFile.file_type === 'svelte'}
								<div class="iframe-wrapper">
									<iframe
										src="/api/lesson-preview/{activeFile.id}"
										title={activeFile.file_name}
										sandbox="allow-scripts allow-same-origin"
										class="preview-iframe"
									></iframe>
								</div>
							{/if}
						{/if}
					</div>
				{:else}
					<div class="no-lesson-selected">
						<p>Select a lesson from the list to get started.</p>
					</div>
				{/if}
			</main>
		</div>
	{:else}
		<div class="banner-error">Course not found</div>
	{/if}
</div>

<style>
	.viewer-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		height: 100vh;
		background: var(--color-background);
		overflow: hidden;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 40vh;
		padding: 2rem;
	}

	.banner-error {
		background: rgba(220, 53, 69, 0.1);
		color: var(--danger);
		padding: 1rem 1.25rem;
		text-align: center;
		border-radius: 8px;
		max-width: 28rem;
		margin: 0;
	}

	.back-link-inline {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.95rem;
	}

	.back-link-inline:hover {
		text-decoration: underline;
	}

	.viewer-header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: start;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 2px solid var(--border);
		background: var(--secondary-background);
		flex-shrink: 0;
	}

	.back-link {
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.9rem;
		white-space: nowrap;
		padding-top: 0.25rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.header-center {
		min-width: 0;
		text-align: center;
	}

	.course-title {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 0.35rem;
		color: var(--color-text);
	}

	.course-desc {
		margin: 0 0 0.35rem;
		font-size: 0.88rem;
		color: var(--muted);
		line-height: 1.45;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta-line {
		font-size: 0.8rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.header-right {
		min-width: 120px;
		padding-top: 0.25rem;
	}

	.progress-bar-wrap {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.progress-bar {
		width: 120px;
		height: 6px;
		background: var(--border);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.25s ease;
	}

	.progress-pct {
		font-size: 0.75rem;
		color: var(--muted);
		font-weight: 600;
	}

	.viewer-body {
		display: grid;
		grid-template-columns: 280px 1fr;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.viewer-sidebar {
		border-right: 2px solid var(--border);
		background: var(--secondary-background);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		padding: 1rem 1rem 0.5rem;
		flex-shrink: 0;
	}

	.sidebar-title {
		font-weight: 700;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--muted);
	}

	.lessons-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.25rem 0;
	}

	.no-lessons {
		padding: 1rem;
		color: var(--muted);
		font-size: 0.875rem;
		font-style: italic;
	}

	.lesson-nav-item {
		border-left: 3px solid transparent;
		transition: background 0.15s;
	}

	.lesson-nav-item.active {
		background: rgba(116, 118, 252, 0.1);
		border-left-color: var(--color-primary);
	}

	.lesson-nav-item:hover:not(.active) {
		background: var(--color-background);
	}

	.lesson-nav-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		min-width: 0;
		color: var(--color-text);
	}

	.lesson-nav-num {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--border);
		font-size: 0.7rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.lesson-nav-item.active .lesson-nav-num {
		background: var(--color-primary);
		color: white;
	}

	.lesson-nav-title {
		flex: 1;
		font-size: 0.85rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.prog-dot {
		font-size: 0.75rem;
		flex-shrink: 0;
		opacity: 0.85;
	}

	.prog-dot.done {
		color: #059669;
	}
	.prog-dot.progress {
		color: #d97706;
	}
	.prog-dot.todo {
		color: var(--muted);
	}

	.viewer-main {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
		background: var(--secondary-background);
	}

	.tab-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 0.5rem 0.5rem 0;
		background: var(--color-background);
		border-bottom: 2px solid var(--border);
		flex-shrink: 0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 0.75rem;
		border: 1px solid transparent;
		border-bottom: none;
		border-radius: 6px 6px 0 0;
		background: none;
		color: var(--muted);
		font-size: 0.85rem;
		cursor: pointer;
		position: relative;
		bottom: -2px;
	}

	.tab-btn:hover:not(.active) {
		background: var(--secondary-background);
		color: var(--color-text);
	}

	.tab-btn.active {
		background: var(--secondary-background);
		color: var(--color-text);
		border-color: var(--border);
		border-bottom-color: var(--secondary-background);
		font-weight: 600;
	}

	.tab-icon {
		font-size: 0.85rem;
	}

	.tab-name {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		min-height: 0;
	}

	.empty-tab,
	.no-lesson-selected {
		text-align: center;
		color: var(--muted);
		padding: 3rem 1.5rem;
		font-style: italic;
	}

	.loading {
		color: var(--muted);
		padding: 2rem;
		text-align: center;
	}

	.markdown-preview {
		line-height: 1.75;
		color: var(--color-text);
		max-width: 48rem;
		margin: 0 auto;
	}

	.markdown-preview :global(h1),
	.markdown-preview :global(h2),
	.markdown-preview :global(h3),
	.markdown-preview :global(h4) {
		color: var(--color-text);
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.markdown-preview :global(p) {
		margin-bottom: 1rem;
	}

	.markdown-preview :global(pre) {
		background: var(--color-background);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 1rem;
		overflow-x: auto;
	}

	.markdown-preview :global(code) {
		font-family: monospace;
	}

	.markdown-preview :global(p code) {
		background: var(--color-background);
		padding: 0.1em 0.35em;
		border-radius: 3px;
		font-size: 0.875em;
	}

	.markdown-preview :global(img) {
		max-width: 100%;
		border-radius: 6px;
	}

	.markdown-preview :global(blockquote) {
		border-left: 4px solid var(--color-primary);
		margin: 0;
		padding: 0.5rem 1rem;
		color: var(--muted);
	}

	.markdown-preview :global(ul),
	.markdown-preview :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	.video-wrapper {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}

	.preview-video {
		width: 100%;
		max-width: 900px;
		border-radius: 8px;
	}

	.iframe-wrapper {
		width: 100%;
	}

	.preview-iframe {
		width: 100%;
		min-height: min(70vh, 520px);
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--color-background);
	}

	@media (max-width: 800px) {
		.viewer-header {
			grid-template-columns: 1fr;
			text-align: center;
		}

		.header-right {
			align-items: center;
		}

		.progress-bar-wrap {
			align-items: center;
		}

		.viewer-body {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}

		.viewer-sidebar {
			border-right: none;
			border-bottom: 2px solid var(--border);
			max-height: 40vh;
		}
	}
</style>
