<script lang="ts">
  import { enhance } from '$app/forms';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { Lesson, LessonFile, CourseAccessGrant } from '$lib/types/courses';

  const { data, form } = $props();
  const {
    course,
    lessons: initialLessons,
    lessonFilesMap: initialFilesMap,
    accessGrants: initialGrants,
    hiddenPairs: initialHiddenPairs,
    origin
  } = data;

  // ── Reactive state ────────────────────────────────────────────────
  let lessons = $state<Lesson[]>(initialLessons);
  let lessonFilesMap = $state<Record<string, LessonFile[]>>(initialFilesMap ?? {});
  let accessGrants = $state<CourseAccessGrant[]>(initialGrants ?? []);

  // Hidden set: "lessonId:userId" keys that are currently hidden
  let hiddenSet = $state<Set<string>>(
    new Set((initialHiddenPairs ?? []).map((p: { lesson_id: string; user_id: string }) => `${p.lesson_id}:${p.user_id}`))
  );

  let selectedLessonId = $state<string | null>(initialLessons[0]?.id ?? null);
  let activeTabIndex = $state(0);

  let showAddLesson = $state(false);
  let addLessonTitle = $state('');
  let addLessonError = $state('');

  let uploadingFor = $state<string | null>(null);
  let uploadError = $state<Record<string, string>>({});

  let grantEmail = $state('');
  let grantError = $state('');
  let grantSuccess = $state('');

  let inviteToken = $state<string>(course.invite_token ?? '');
  let inviteCopied = $state(false);

  // ── Derived ──────────────────────────────────────────────────────
  const selectedLesson = $derived(lessons.find(l => l.id === selectedLessonId) ?? null);
  const selectedFiles = $derived(selectedLessonId ? (lessonFilesMap[selectedLessonId] ?? []) : []);
  const activeFile = $derived(selectedFiles[activeTabIndex] ?? null);

  // Use server-provided origin (avoids SSR/reactivity issues with page.url)
  const inviteUrl = $derived(
    inviteToken ? `${origin}/courses/join/${inviteToken}` : ''
  );

  // Reset tab when lesson changes
  $effect(() => {
    selectedLessonId; // track
    activeTabIndex = 0;
  });

  // ── Storage URL helper ────────────────────────────────────────────
  function storageUrl(path: string): string {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/lesson-files/${path}`;
  }

  function fileTypeIcon(type: LessonFile['file_type']): string {
    if (type === 'markdown') return '📄';
    if (type === 'video') return '▶';
    return '⚡';
  }

  // ── Lesson actions ────────────────────────────────────────────────
  function handleLessonCreated(result: any) {
    if (result.type === 'success' && result.data?.lesson) {
      lessons = [...lessons, result.data.lesson];
      selectedLessonId = result.data.lesson.id;
      showAddLesson = false;
      addLessonTitle = '';
    }
  }

  function handleLessonDeleted(lessonId: string, result: any) {
    if (result.type === 'success') {
      lessons = lessons.filter(l => l.id !== lessonId);
      if (selectedLessonId === lessonId) {
        selectedLessonId = lessons[0]?.id ?? null;
      }
    }
  }

  function handlePublishToggle(lessonId: string, published: boolean, result: any) {
    if (result.type === 'success') {
      lessons = lessons.map(l =>
        l.id === lessonId ? { ...l, is_published: published } : l
      );
    }
  }

  // ── File upload / delete ──────────────────────────────────────────
  async function uploadFile(lessonId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadingFor = lessonId;
    uploadError = { ...uploadError, [lessonId]: '' };

    const existing = lessonFilesMap[lessonId] ?? [];
    const formData = new FormData();
    formData.append('lesson_id', lessonId);
    formData.append('file', file);
    formData.append('tab_order', String(existing.length));

    try {
      const res = await fetch('/api/lesson-files', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      const updated = { ...lessonFilesMap, [lessonId]: [...existing, json] };
      lessonFilesMap = updated;
      activeTabIndex = updated[lessonId].length - 1;
    } catch (err) {
      uploadError = { ...uploadError, [lessonId]: err instanceof Error ? err.message : 'Upload failed' };
    } finally {
      uploadingFor = null;
      input.value = '';
    }
  }

  async function deleteFile(lessonId: string, fileId: string) {
    try {
      const res = await fetch(`/api/lesson-files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Delete failed');
      }
      const updated = { ...lessonFilesMap, [lessonId]: (lessonFilesMap[lessonId] ?? []).filter(f => f.id !== fileId) };
      lessonFilesMap = updated;
      if (activeTabIndex >= (updated[lessonId]?.length ?? 0)) {
        activeTabIndex = Math.max(0, (updated[lessonId]?.length ?? 0) - 1);
      }
    } catch (err) {
      uploadError = { ...uploadError, [lessonId]: err instanceof Error ? err.message : 'Delete failed' };
    }
  }

  // ── Access control ────────────────────────────────────────────────
  function handleGrantResult(result: any) {
    grantError = '';
    grantSuccess = '';
    if (result.type === 'success') {
      grantSuccess = result.data?.message ?? 'Access granted';
      grantEmail = '';
      // Reload page to get updated grants list
      window.location.reload();
    } else if (result.data?.error) {
      grantError = result.data.error;
    }
  }

  function handleRevokeResult(grantId: string, result: any) {
    if (result.type === 'success') {
      accessGrants = accessGrants.filter(g => g.id !== grantId);
    }
  }

  function handleRegenerateResult(result: any) {
    if (result.type === 'success' && result.data?.invite_token) {
      inviteToken = result.data.invite_token;
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      inviteCopied = true;
      setTimeout(() => (inviteCopied = false), 2000);
    } catch {
      // Fallback: select the input text
    }
  }

  // ── Lesson visibility ─────────────────────────────────────────────
  function isHidden(lessonId: string, userId: string): boolean {
    return hiddenSet.has(`${lessonId}:${userId}`);
  }

  function handleVisibilityToggle(lessonId: string, userId: string, result: any) {
    if (result.type === 'success') {
      const key = `${lessonId}:${userId}`;
      const next = new Set(hiddenSet);
      if (hiddenSet.has(key)) {
        next.delete(key); // was hidden, now visible
      } else {
        next.add(key); // was visible, now hidden
      }
      hiddenSet = next;
    }
  }

  // Toggle a lesson for ALL current users at once (global convenience)
  async function toggleLessonForAll(lessonId: string, makeVisible: boolean) {
    const userIds = accessGrants
      .map(g => (g.profiles as any)?.id)
      .filter(Boolean);

    for (const userId of userIds) {
      const key = `${lessonId}:${userId}`;
      const alreadyHidden = hiddenSet.has(key);
      if (makeVisible && alreadyHidden) {
        // Need to un-hide
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('lessonId', lessonId);
        fd.append('isVisible', 'true');
        await fetch('?/toggleLessonVisibility', { method: 'POST', body: fd });
      } else if (!makeVisible && !alreadyHidden) {
        // Need to hide
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('lessonId', lessonId);
        fd.append('isVisible', 'false');
        await fetch('?/toggleLessonVisibility', { method: 'POST', body: fd });
      }
    }

    // Update local state
    const next = new Set(hiddenSet);
    for (const userId of userIds) {
      const key = `${lessonId}:${userId}`;
      if (makeVisible) next.delete(key);
      else next.add(key);
    }
    hiddenSet = next;
  }

  // Whether all students can see a given lesson (no one has it hidden)
  function allCanSee(lessonId: string): boolean {
    return accessGrants.every(g => {
      const uid = (g.profiles as any)?.id;
      return uid ? !hiddenSet.has(`${lessonId}:${uid}`) : true;
    });
  }

  // ── Markdown renderer (inline, minimal) ──────────────────────────
  let markdownCache = $state<Record<string, string>>({});
  let markdownLoading = $state(false);

  $effect(() => {
    const f = activeFile;
    if (f?.file_type === 'markdown' && !markdownCache[f.id]) {
      markdownLoading = true;
      fetch(storageUrl(f.storage_path))
        .then(r => r.text())
        .then(async text => {
          const { marked } = await import('marked');
          markdownCache = { ...markdownCache, [f.id]: await marked.parse(text) };
        })
        .catch(() => {
          markdownCache = { ...markdownCache, [activeFile?.id ?? '']: '<p>Failed to load.</p>' };
        })
        .finally(() => (markdownLoading = false));
    }
  });
</script>

<div class="editor-shell">
  <!-- ── Top bar ─────────────────────────────────────────────────── -->
  <header class="editor-header">
    <a href="/create-course" class="back-link">← My Courses</a>
    <div class="header-center">
      <h1 class="course-title">{course.title}</h1>
      <span class="course-status {course.is_published ? 'published' : 'draft'}">
        {course.is_published ? 'Published' : 'Draft'}
      </span>
    </div>
    <div class="header-right">
      {#if form?.error}
        <span class="header-error">{form.error}</span>
      {/if}
    </div>
  </header>

  <!-- ── Main layout ────────────────────────────────────────────── -->
  <div class="editor-body">

    <!-- Left sidebar: lessons list -->
    <aside class="editor-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">Lessons</span>
        <button class="btn-icon" onclick={() => { showAddLesson = !showAddLesson; addLessonError = ''; }}>
          {showAddLesson ? '✕' : '+'}
        </button>
      </div>

      {#if showAddLesson}
        <form
          method="POST"
          action="?/createLesson"
          class="add-lesson-form"
          use:enhance={() => {
            return async ({ result }) => handleLessonCreated(result);
          }}
        >
          <input
            type="text"
            name="title"
            bind:value={addLessonTitle}
            placeholder="Lesson title"
            required
            class="add-lesson-input"
          />
          <input
            type="hidden"
            name="order_index"
            value={lessons.length + 1}
          />
          {#if addLessonError}
            <p class="form-error">{addLessonError}</p>
          {/if}
          <button type="submit" class="btn-add-lesson">Create Lesson</button>
        </form>
      {/if}

      <nav class="lessons-nav">
        {#if lessons.length === 0}
          <p class="no-lessons">No lessons yet.</p>
        {:else}
          {#each lessons as lesson, i}
            <div
              class="lesson-nav-item"
              class:active={lesson.id === selectedLessonId}
            >
              <button
                class="lesson-nav-btn"
                onclick={() => selectedLessonId = lesson.id}
              >
                <span class="lesson-nav-num">{i + 1}</span>
                <span class="lesson-nav-title">{lesson.title}</span>
                <span class="lesson-status-badge {lesson.is_published ? 'published' : 'draft'}">
                  {lesson.is_published ? '✓' : 'D'}
                </span>
              </button>

              <!-- Publish / Unpublish toggle -->
              <div class="lesson-nav-actions">
                {#if lesson.is_published}
                  <form
                    method="POST"
                    action="?/unpublishLesson"
                    use:enhance={() => {
                      return async ({ result }) => handlePublishToggle(lesson.id, false, result);
                    }}
                  >
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button type="submit" class="btn-nav-action unpublish" title="Unpublish">↩</button>
                  </form>
                {:else}
                  <form
                    method="POST"
                    action="?/publishLesson"
                    use:enhance={() => {
                      return async ({ result }) => handlePublishToggle(lesson.id, true, result);
                    }}
                  >
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button type="submit" class="btn-nav-action publish" title="Publish">↗</button>
                  </form>
                {/if}

                <form
                  method="POST"
                  action="?/deleteLesson"
                  use:enhance={() => {
                    return async ({ result }) => handleLessonDeleted(lesson.id, result);
                  }}
                >
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <button
                    type="submit"
                    class="btn-nav-action delete"
                    title="Delete lesson"
                    onclick={(e) => {
                      if (!confirm(`Delete "${lesson.title}"?`)) e.preventDefault();
                    }}
                  >✕</button>
                </form>
              </div>
            </div>
          {/each}
        {/if}
      </nav>
    </aside>

    <!-- Right: file editor + access control -->
    <div class="editor-main">

      {#if selectedLesson}
        <!-- Tab bar -->
        <div class="tab-bar">
          {#each selectedFiles as file, i}
            <div
              class="tab-btn"
              class:active={i === activeTabIndex}
              role="tab"
              aria-selected={i === activeTabIndex}
              tabindex="0"
              onclick={() => activeTabIndex = i}
              onkeydown={(e) => e.key === 'Enter' && (activeTabIndex = i)}
            >
              <span class="tab-icon">{fileTypeIcon(file.file_type)}</span>
              <span class="tab-name">{file.file_name}</span>
              <button
                class="tab-remove"
                title="Remove file"
                onclick={(e) => { e.stopPropagation(); deleteFile(selectedLesson.id, file.id); }}
              >×</button>
            </div>
          {/each}

          <!-- Upload new file button -->
          <label class="tab-upload-btn" title="Upload new file (.md, .svelte, video)">
            {#if uploadingFor === selectedLesson.id}
              <span class="uploading-text">…</span>
            {:else}
              +
              <input
                type="file"
                accept=".md,.svelte,.mp4,.webm,.ogg,.mov,.avi"
                class="file-input-hidden"
                onchange={(e) => uploadFile(selectedLesson.id, e)}
                disabled={uploadingFor === selectedLesson.id}
              />
            {/if}
          </label>
        </div>

        {#if uploadError[selectedLesson.id]}
          <p class="upload-err">{uploadError[selectedLesson.id]}</p>
        {/if}

        <!-- Tab content -->
        <div class="tab-content">
          {#if selectedFiles.length === 0}
            <div class="empty-tab">
              <p>No files yet for this lesson.</p>
              <p class="empty-hint">Click <strong>+</strong> in the tab bar to upload a <code>.md</code>, <code>.svelte</code>, or video file.</p>
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
                <video controls src={storageUrl(activeFile.storage_path)} class="preview-video"></video>
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
          <p>Select a lesson from the sidebar, or create your first lesson.</p>
        </div>
      {/if}

      <!-- ── Students & Lesson Access panel ───────────────────── -->
      <section class="access-panel">
        <h2 class="access-title">Students & Lesson Access</h2>

        <!-- Invite row -->
        <div class="invite-section">
          <div class="invite-left">
            <span class="access-label">Invite link</span>
            {#if inviteToken}
              <div class="invite-row">
                <input
                  type="text"
                  readonly
                  value={inviteUrl}
                  class="invite-input"
                  onclick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button class="btn-copy" onclick={copyInviteLink}>
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
                <form
                  method="POST"
                  action="?/regenerateInviteToken"
                  use:enhance={() => {
                    return async ({ result }) => handleRegenerateResult(result);
                  }}
                >
                  <button
                    type="submit"
                    class="btn-regen"
                    title="Invalidates the current link"
                    onclick={(e) => {
                      if (!confirm('Regenerate invite link? The old link will stop working.')) e.preventDefault();
                    }}
                  >Regenerate</button>
                </form>
              </div>
            {:else}
              <p class="no-token-hint">Run the course_access.sql migration in Supabase to enable invite links.</p>
            {/if}
          </div>

          <div class="invite-right">
            <span class="access-label">Add by email</span>
            <form
              method="POST"
              action="?/grantAccess"
              class="grant-form"
              use:enhance={() => {
                return async ({ result }) => handleGrantResult(result);
              }}
            >
              <input
                type="email"
                name="email"
                bind:value={grantEmail}
                placeholder="user@example.com"
                required
                class="grant-input"
              />
              <button type="submit" class="btn-grant">Add</button>
            </form>
            {#if grantError}<p class="form-error">{grantError}</p>{/if}
            {#if grantSuccess}<p class="form-success">{grantSuccess}</p>{/if}
          </div>
        </div>

        <!-- Students × Lessons grid -->
        {#if lessons.length === 0}
          <p class="no-grants">Create lessons first to manage per-student visibility.</p>
        {:else if accessGrants.length === 0}
          <p class="no-grants">No students enrolled yet. Share the invite link or add emails above.</p>
        {:else}
          <div class="students-grid-wrapper">
            <table class="students-grid">
              <thead>
                <tr>
                  <th class="th-name">Student</th>
                  {#each lessons as lesson}
                    <th class="th-lesson" title={lesson.title}>
                      <span class="lesson-col-name">{lesson.title}</span>
                      <div class="global-toggle" title="Toggle for all students">
                        <input
                          type="checkbox"
                          id="global-{lesson.id}"
                          checked={lesson.is_published}
                          class="global-cb"
                          onchange={async (e) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            // Use publish/unpublish action
                            const fd = new FormData();
                            fd.append('lessonId', lesson.id);
                            await fetch(checked ? '?/publishLesson' : '?/unpublishLesson', {
                              method: 'POST', body: fd
                            });
                            lessons = lessons.map(l =>
                              l.id === lesson.id ? { ...l, is_published: checked } : l
                            );
                            // Sync per-user visibility (if unpublishing, hide for all)
                            if (!checked) await toggleLessonForAll(lesson.id, false);
                          }}
                        />
                        <label for="global-{lesson.id}" class="global-cb-label" title="Published (visible to all)">
                          {lesson.is_published ? '●' : '○'}
                        </label>
                      </div>
                    </th>
                  {/each}
                  <th class="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {#each accessGrants as grant}
                  {@const grantProfile = grant.profiles as any}
                  {@const userId = grantProfile?.id}
                  {@const joined = !!(grant as any).joined_at}
                  <tr class:pending={!joined}>
                    <td class="td-name">
                      <span class="student-dot {joined ? 'joined' : 'pending'}" title={joined ? 'Joined' : 'Invited, not joined yet'}></span>
                      <span class="student-name">{grantProfile?.full_name ?? grantProfile?.email ?? 'Unknown'}</span>
                      {#if !joined}
                        <span class="pending-label">pending</span>
                      {/if}
                    </td>

                    {#each lessons as lesson}
                      {@const hidden = isHidden(lesson.id, userId)}
                      <td class="td-check">
                        <form
                          method="POST"
                          action="?/toggleLessonVisibility"
                          use:enhance={() => {
                            return async ({ result }) => handleVisibilityToggle(lesson.id, userId, result);
                          }}
                        >
                          <input type="hidden" name="userId" value={userId} />
                          <input type="hidden" name="lessonId" value={lesson.id} />
                          <input type="hidden" name="isVisible" value={hidden ? 'true' : 'false'} />
                          <button
                            type="submit"
                            class="vis-btn"
                            class:checked={!hidden}
                            disabled={!lesson.is_published}
                            title={!lesson.is_published ? 'Lesson is unpublished globally' : (hidden ? 'Hidden — click to show' : 'Visible — click to hide')}
                          >
                            {hidden ? '☐' : '☑'}
                          </button>
                        </form>
                      </td>
                    {/each}

                    <td class="td-actions">
                      <form
                        method="POST"
                        action="?/revokeAccess"
                        use:enhance={() => {
                          return async ({ result }) => handleRevokeResult(grant.id, result);
                        }}
                      >
                        <input type="hidden" name="grantId" value={grant.id} />
                        <button type="submit" class="btn-revoke" title="Remove from course">✕</button>
                      </form>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <p class="grid-legend">
            <span class="legend-dot joined"></span> Joined &nbsp;
            <span class="legend-dot pending"></span> Invited (not joined yet) &nbsp;
            ● Published &nbsp; ○ Unpublished &nbsp;
            ☑ Visible to student &nbsp; ☐ Hidden from student
          </p>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .editor-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-background);
    overflow: hidden;
  }

  /* ── Header ─────────────────────────────────────── */
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    border-bottom: 2px solid var(--border);
    background: var(--secondary-background);
    flex-shrink: 0;
    gap: 1rem;
  }

  .back-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .back-link:hover { text-decoration: underline; }

  .header-center {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    justify-content: center;
  }

  .course-title {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text);
  }

  .course-status {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .course-status.published { background: #d1fae5; color: #065f46; }
  .course-status.draft     { background: #fef3c7; color: #92400e; }

  .header-right { min-width: 100px; text-align: right; }
  .header-error { color: var(--danger); font-size: 0.85rem; }

  /* ── Body split ─────────────────────────────────── */
  .editor-body {
    display: grid;
    grid-template-columns: 280px 1fr;
    flex: 1;
    overflow: hidden;
  }

  /* ── Sidebar ────────────────────────────────────── */
  .editor-sidebar {
    border-right: 2px solid var(--border);
    background: var(--secondary-background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .btn-icon {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--color-background);
    color: var(--color-text);
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .add-lesson-form {
    padding: 0.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border-bottom: 1px solid var(--border);
  }

  .add-lesson-input {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .btn-add-lesson {
    padding: 5px 10px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
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
    display: flex;
    align-items: center;
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
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    min-width: 0;
    color: var(--color-text);
  }

  .lesson-nav-num {
    width: 20px;
    height: 20px;
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

  .lesson-status-badge {
    padding: 1px 5px;
    border-radius: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .lesson-status-badge.published { background: #d1fae5; color: #065f46; }
  .lesson-status-badge.draft     { background: #fef3c7; color: #92400e; }

  .lesson-nav-actions {
    display: flex;
    gap: 2px;
    padding-right: 6px;
    flex-shrink: 0;
  }

  .btn-nav-action {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
  }

  .btn-nav-action.publish   { color: #065f46; }
  .btn-nav-action.unpublish { color: #92400e; }
  .btn-nav-action.delete    { color: #dc3545; }
  .btn-nav-action:hover { background: var(--border); }

  /* ── Main content ───────────────────────────────── */
  .editor-main {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .no-lesson-selected {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    font-style: italic;
    padding: 3rem;
  }

  /* Tab bar */
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
    padding: 0.4rem 0.75rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: none;
    color: var(--muted);
    font-size: 0.85rem;
    cursor: pointer;
    position: relative;
    bottom: -2px;
    transition: background 0.15s;
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

  .tab-icon { font-size: 0.85rem; }

  .tab-name {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-remove {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0 1px;
    border-radius: 3px;
  }

  .tab-remove:hover { color: var(--danger); background: rgba(220,53,69,0.1); }

  .tab-upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 700;
    position: relative;
    bottom: -2px;
    margin-left: 4px;
    transition: opacity 0.15s;
  }

  .tab-upload-btn:hover { opacity: 0.85; }
  .uploading-text { font-size: 0.75rem; font-style: italic; }

  .file-input-hidden {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }

  .upload-err {
    color: var(--danger);
    font-size: 0.85rem;
    padding: 0.25rem 1rem 0;
    margin: 0;
  }

  /* Tab content */
  .tab-content {
    flex: 1;
    padding: 1.5rem;
    min-height: 300px;
  }

  .empty-tab {
    text-align: center;
    color: var(--muted);
    padding: 3rem;
  }

  .empty-hint { font-size: 0.9rem; margin-top: 0.5rem; }

  .loading { color: var(--muted); font-style: italic; padding: 2rem; text-align: center; }

  .markdown-preview {
    line-height: 1.75;
    color: var(--color-text);
  }

  .markdown-preview :global(h1), .markdown-preview :global(h2),
  .markdown-preview :global(h3), .markdown-preview :global(h4) {
    color: var(--color-text);
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .markdown-preview :global(p) { margin-bottom: 1rem; }

  .markdown-preview :global(pre) {
    background: var(--color-background);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
  }

  .markdown-preview :global(code) { font-family: monospace; }
  .markdown-preview :global(p code) {
    background: var(--color-background);
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-size: 0.875em;
  }

  .markdown-preview :global(img) { max-width: 100%; border-radius: 6px; }
  .markdown-preview :global(blockquote) {
    border-left: 4px solid var(--color-primary);
    margin: 0;
    padding: 0.5rem 1rem;
    color: var(--muted);
  }

  .markdown-preview :global(ul), .markdown-preview :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .video-wrapper { display: flex; justify-content: center; padding: 1rem 0; }
  .preview-video { width: 100%; max-width: 900px; border-radius: 8px; }

  .iframe-wrapper { width: 100%; }
  .preview-iframe {
    width: 100%;
    min-height: 500px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--color-background);
  }

  /* ── Access / Students panel ────────────────────── */
  .access-panel {
    border-top: 2px solid var(--border);
    padding: 1.25rem 1.5rem 1.5rem;
    background: var(--secondary-background);
    flex-shrink: 0;
  }

  .access-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: var(--color-text);
  }

  .access-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--muted);
    display: block;
    margin-bottom: 0.4rem;
  }

  /* Invite top row */
  .invite-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border);
  }

  .invite-left, .invite-right {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .invite-row {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .invite-input {
    flex: 1;
    min-width: 140px;
    padding: 6px 9px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.8rem;
    font-family: monospace;
  }

  .no-token-hint {
    color: var(--muted);
    font-size: 0.8rem;
    font-style: italic;
    margin: 0;
  }

  .btn-copy, .btn-regen {
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .btn-copy { background: var(--color-primary); color: white; border: none; }
  .btn-regen {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--color-text);
  }
  .btn-regen:hover { background: var(--border); }

  .grant-form { display: flex; gap: 0.4rem; flex-wrap: wrap; }

  .grant-input {
    flex: 1;
    min-width: 160px;
    padding: 6px 9px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .btn-grant {
    padding: 6px 14px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
  }

  /* Students × Lessons grid */
  .students-grid-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 0.75rem;
  }

  .students-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .students-grid th, .students-grid td {
    border: 1px solid var(--border);
    padding: 0.4rem 0.6rem;
    text-align: center;
    vertical-align: middle;
  }

  .th-name, .td-name {
    text-align: left;
    min-width: 160px;
    max-width: 220px;
    position: sticky;
    left: 0;
    background: var(--secondary-background);
    z-index: 1;
  }

  .th-lesson {
    min-width: 90px;
    max-width: 120px;
    font-weight: 600;
  }

  .lesson-col-name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8rem;
    color: var(--color-text);
    margin-bottom: 4px;
  }

  .global-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .global-cb { display: none; }

  .global-cb-label {
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    user-select: none;
  }

  .th-actions { width: 36px; min-width: 36px; }

  /* Pending row */
  tr.pending { opacity: 0.55; }

  .td-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
  }

  .student-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .student-dot.joined  { background: #10b981; }
  .student-dot.pending { background: #9ca3af; }

  .student-name { font-weight: 500; color: var(--color-text); }

  .pending-label {
    font-size: 0.7rem;
    color: var(--muted);
    background: var(--color-background);
    border: 1px solid var(--border);
    padding: 1px 5px;
    border-radius: 8px;
  }

  .td-check { padding: 0.25rem; }

  .vis-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 2px;
    color: var(--color-text);
    transition: transform 0.1s;
  }

  .vis-btn:hover:not(:disabled) { transform: scale(1.2); }
  .vis-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .vis-btn.checked { color: var(--color-primary); }

  .td-actions { padding: 0.25rem; }

  .btn-revoke {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.85rem;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .btn-revoke:hover { color: var(--danger); background: rgba(220,53,69,0.1); }

  .grid-legend {
    font-size: 0.75rem;
    color: var(--muted);
    margin: 0;
  }

  .legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    vertical-align: middle;
    margin-right: 2px;
  }
  .legend-dot.joined  { background: #10b981; }
  .legend-dot.pending { background: #9ca3af; }

  .no-grants {
    color: var(--muted);
    font-size: 0.875rem;
    font-style: italic;
    margin: 0;
  }

  .form-error   { color: var(--danger); font-size: 0.85rem; margin: 0; }
  .form-success { color: #065f46; font-size: 0.85rem; margin: 0; }

  /* ── Responsive ─────────────────────────────────── */
  @media (max-width: 700px) {
    .editor-body {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }

    .editor-sidebar {
      border-right: none;
      border-bottom: 2px solid var(--border);
      max-height: 220px;
    }
  }
</style>
