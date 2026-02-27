<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import type { LessonFile } from '$lib/types/courses';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';

  const { files }: { files: LessonFile[] } = $props();
  // lessonId is available via files[n].lesson_id if needed

  let activeIndex = $state(0);
  let markdownCache = $state<Record<string, string>>({});
  let loadingMarkdown = $state(false);

  const activeFile = $derived(files[activeIndex] ?? null);

  function getPublicUrl(storagePath: string): string {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesson-files/${storagePath}`;
  }

  function getFileIcon(type: LessonFile['file_type']): string {
    if (type === 'markdown') return '📄';
    if (type === 'video') return '▶';
    return '⚡';
  }

  async function loadMarkdown(file: LessonFile) {
    if (markdownCache[file.id]) return;
    loadingMarkdown = true;
    try {
      const url = getPublicUrl(file.storage_path);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      markdownCache = { ...markdownCache, [file.id]: await marked.parse(text) };
    } catch (err) {
      markdownCache = {
        ...markdownCache,
        [file.id]: `<p class="md-error">Failed to load content: ${err instanceof Error ? err.message : 'Unknown error'}</p>`
      };
    } finally {
      loadingMarkdown = false;
    }
  }

  $effect(() => {
    if (activeFile?.file_type === 'markdown') {
      loadMarkdown(activeFile);
    }
  });

  function selectTab(index: number) {
    activeIndex = index;
  }
</script>

<div class="lesson-file-tabs">
  {#if files.length === 0}
    <div class="no-files">
      <p>No content uploaded yet.</p>
    </div>
  {:else}
    <!-- Tab bar -->
    <div class="tab-bar" role="tablist">
      {#each files as file, i}
        <button
          role="tab"
          aria-selected={i === activeIndex}
          aria-controls="tab-panel-{i}"
          class="tab-btn"
          class:active={i === activeIndex}
          onclick={() => selectTab(i)}
        >
          <span class="tab-icon">{getFileIcon(file.file_type)}</span>
          <span class="tab-name">{file.file_name}</span>
        </button>
      {/each}
    </div>

    <!-- Tab content -->
    {#if activeFile}
      <div
        class="tab-panel"
        id="tab-panel-{activeIndex}"
        role="tabpanel"
      >
        {#if activeFile.file_type === 'markdown'}
          {#if loadingMarkdown && !markdownCache[activeFile.id]}
            <div class="loading">Loading…</div>
          {:else}
            <div class="markdown-body">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html markdownCache[activeFile.id] ?? ''}
            </div>
          {/if}

        {:else if activeFile.file_type === 'video'}
          <div class="video-wrapper">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
              controls
              src={getPublicUrl(activeFile.storage_path)}
              class="lesson-video"
            >
            </video>
          </div>

        {:else if activeFile.file_type === 'svelte'}
          <div class="iframe-wrapper">
            <iframe
              src="/api/lesson-preview/{activeFile.id}"
              title={activeFile.file_name}
              sandbox="allow-scripts allow-same-origin"
              class="lesson-iframe"
            ></iframe>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .lesson-file-tabs {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--secondary-background);
  }

  .no-files {
    padding: 3rem;
    text-align: center;
    color: var(--muted);
    font-style: italic;
  }

  /* Tab bar */
  .tab-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 0.5rem 0.5rem 0;
    background: var(--color-background);
    border-bottom: 2px solid var(--border);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: none;
    color: var(--muted);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
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
    font-size: 0.9rem;
  }

  .tab-name {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Tab panel */
  .tab-panel {
    padding: 1.5rem;
    min-height: 200px;
  }

  /* Loading */
  .loading {
    color: var(--muted);
    font-style: italic;
    padding: 2rem;
    text-align: center;
  }

  /* Markdown */
  .markdown-body {
    line-height: 1.75;
    color: var(--color-text);
  }

  .markdown-body :global(h1),
  .markdown-body :global(h2),
  .markdown-body :global(h3),
  .markdown-body :global(h4) {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }

  .markdown-body :global(p) {
    margin-bottom: 1rem;
  }

  .markdown-body :global(pre) {
    background: var(--color-background);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
  }

  .markdown-body :global(code) {
    font-family: 'Courier New', Consolas, monospace;
  }

  .markdown-body :global(p code) {
    background: var(--color-background);
    padding: 0.15em 0.4em;
    border-radius: 3px;
    font-size: 0.875em;
  }

  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 6px;
  }

  .markdown-body :global(blockquote) {
    border-left: 4px solid var(--color-primary);
    margin: 0;
    padding: 0.5rem 1rem;
    color: var(--muted);
    background: var(--color-background);
    border-radius: 0 6px 6px 0;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    border: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
    text-align: left;
  }

  .markdown-body :global(th) {
    background: var(--color-background);
    font-weight: 600;
  }

  :global(.md-error) {
    color: var(--danger);
  }

  /* Video */
  .video-wrapper {
    display: flex;
    justify-content: center;
  }

  .lesson-video {
    width: 100%;
    max-width: 900px;
    border-radius: 8px;
    background: #000;
  }

  /* Svelte iframe */
  .iframe-wrapper {
    width: 100%;
  }

  .lesson-iframe {
    width: 100%;
    min-height: 500px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--color-background);
  }
</style>
