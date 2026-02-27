<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Lesson, LessonFile } from '$lib/types/courses';
  
  const { data } = $props();
  const { course, lessons, lessonFilesMap: initialFilesMap, error } = data;

  let showCreateLesson = $state(false);
  let editingLesson: Lesson | null = $state(null);
  let showDeleteConfirm = $state<string | null>(null);
  let expandedFiles = $state<Set<string>>(new Set());
  let lessonFilesMap = $state<Record<string, LessonFile[]>>(initialFilesMap ?? {});
  let uploadingFor = $state<string | null>(null);
  let uploadError = $state<Record<string, string>>({});

  function createNewLesson() {
    showCreateLesson = true;
    editingLesson = null;
  }

  function editLesson(lesson: Lesson) {
    editingLesson = lesson;
    showCreateLesson = true;
  }

  function deleteLesson(lessonId: string) {
    showDeleteConfirm = lessonId;
  }

  function toggleFiles(lessonId: string) {
    const next = new Set(expandedFiles);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    expandedFiles = next;
  }

  function handleFormResult(result: any) {
    if (result.type === 'success') {
      showCreateLesson = false;
      editingLesson = null;
      window.location.reload();
    }
  }

  function handleDeleteResult(result: any) {
    if (result.type === 'success') {
      showDeleteConfirm = null;
      window.location.reload();
    }
  }

  async function uploadFile(lessonId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadingFor = lessonId;
    uploadError = { ...uploadError, [lessonId]: '' };

    const existingFiles = lessonFilesMap[lessonId] ?? [];
    const formData = new FormData();
    formData.append('lesson_id', lessonId);
    formData.append('file', file);
    formData.append('tab_order', String(existingFiles.length));

    try {
      const res = await fetch('/api/lesson-files', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      lessonFilesMap = {
        ...lessonFilesMap,
        [lessonId]: [...existingFiles, json]
      };
    } catch (err) {
      uploadError = {
        ...uploadError,
        [lessonId]: err instanceof Error ? err.message : 'Upload failed'
      };
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
      lessonFilesMap = {
        ...lessonFilesMap,
        [lessonId]: (lessonFilesMap[lessonId] ?? []).filter(f => f.id !== fileId)
      };
    } catch (err) {
      uploadError = {
        ...uploadError,
        [lessonId]: err instanceof Error ? err.message : 'Delete failed'
      };
    }
  }

  function fileTypeLabel(type: LessonFile['file_type']): string {
    if (type === 'markdown') return 'MD';
    if (type === 'video') return 'VID';
    return 'SVL';
  }
</script>

<div class="course-management">
  <header class="course-header">
    <div class="breadcrumb">
      <a href="/admin">← Back to Admin</a>
    </div>
    <h1>{course?.title}</h1>
    <p>{course?.description}</p>
    
    <div class="course-meta">
      <span class="kit">{course?.kit?.name}</span>
      <span class="level">Level {course?.level}</span>
      <span class="theme">{course?.theme}</span>
      <span class="status {course?.is_published ? 'published' : 'draft'}">
        {course?.is_published ? 'Published' : 'Draft'}
      </span>
    </div>
  </header>

  {#if error}
    <div class="error-message">{error}</div>
  {:else}
    <div class="management-content">
      <!-- Lessons Section -->
      <section class="lessons-section">
        <div class="section-header">
          <h2>Lessons ({lessons.length})</h2>
          <button class="create-btn" onclick={createNewLesson}>
            + Add Lesson
          </button>
        </div>

        {#if lessons.length === 0}
          <div class="empty-state">
            <p>No lessons created yet. Add your first lesson to get started!</p>
          </div>
        {:else}
          <div class="lessons-list">
            {#each lessons as lesson, index}
              <div class="lesson-card">
                <!-- Lesson header row -->
                <div class="lesson-top">
                  <div class="lesson-info">
                    <div class="lesson-number">{index + 1}</div>
                    <div class="lesson-details">
                      <h3>{lesson.title}</h3>
                      <div class="lesson-meta">
                        <span class="content-type">{lesson.content_type}</span>
                        {#if lesson.estimated_duration}
                          <span class="duration">{lesson.estimated_duration} min</span>
                        {/if}
                        <span class="status {lesson.is_published ? 'published' : 'draft'}">
                          {lesson.is_published ? 'Published' : 'Draft'}
                        </span>
                        <span class="file-count">
                          {(lessonFilesMap[lesson.id] ?? []).length} file(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="lesson-actions">
                    <button
                      class="files-btn"
                      onclick={() => toggleFiles(lesson.id)}
                    >
                      {expandedFiles.has(lesson.id) ? 'Hide Files' : 'Manage Files'}
                    </button>
                    <button class="edit-btn" onclick={() => editLesson(lesson)}>
                      Edit
                    </button>
                    <button class="delete-btn" onclick={() => deleteLesson(lesson.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <!-- Expandable file management panel -->
                {#if expandedFiles.has(lesson.id)}
                  <div class="files-panel">
                    <div class="files-header">
                      <span class="files-title">Lesson Files (Tabs)</span>
                      <label class="upload-label">
                        {#if uploadingFor === lesson.id}
                          <span class="uploading">Uploading…</span>
                        {:else}
                          + Upload File
                          <input
                            type="file"
                            accept=".md,.svelte,.mp4,.webm,.ogg,.mov,.avi"
                            class="file-input-hidden"
                            onchange={(e) => uploadFile(lesson.id, e)}
                            disabled={uploadingFor === lesson.id}
                          />
                        {/if}
                      </label>
                    </div>

                    {#if uploadError[lesson.id]}
                      <p class="upload-error">{uploadError[lesson.id]}</p>
                    {/if}

                    {#if (lessonFilesMap[lesson.id] ?? []).length === 0}
                      <p class="no-files-hint">No files yet. Upload a .md, .svelte, or video file.</p>
                    {:else}
                      <ul class="file-list">
                        {#each lessonFilesMap[lesson.id] as file}
                          <li class="file-item">
                            <span class="file-type-badge {file.file_type}">{fileTypeLabel(file.file_type)}</span>
                            <span class="file-name">{file.file_name}</span>
                            <button
                              class="remove-file-btn"
                              onclick={() => deleteFile(lesson.id, file.id)}
                            >
                              Remove
                            </button>
                          </li>
                        {/each}
                      </ul>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}

  <!-- Create/Edit Lesson Modal -->
  {#if showCreateLesson}
    <div
      class="modal-overlay"
      role="presentation"
      onclick={() => showCreateLesson = false}
      onkeydown={(e) => e.key === 'Escape' && (showCreateLesson = false)}
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h3>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h3>
          <button class="close-btn" onclick={() => showCreateLesson = false}>×</button>
        </div>
        
        <form 
          method="POST" 
          action={editingLesson ? "?/updateLesson" : "?/createLesson"}
          use:enhance={() => {
            return async ({ result }) => {
              handleFormResult(result);
            };
          }}
          enctype="multipart/form-data"
        >
          {#if editingLesson}
            <input type="hidden" name="lessonId" value={editingLesson.id} />
          {/if}
          
          <div class="form-group">
            <label for="title">Lesson Title</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              required 
              value={editingLesson?.title || ''}
              placeholder="Enter lesson title"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="order_index">Order</label>
              <input 
                type="number" 
                id="order_index" 
                name="order_index" 
                required 
                min="1"
                value={editingLesson?.order_index || lessons.length + 1}
              />
            </div>
            
            <div class="form-group">
              <label for="estimated_duration">Duration (minutes)</label>
              <input 
                type="number" 
                id="estimated_duration" 
                name="estimated_duration" 
                min="1"
                value={editingLesson?.estimated_duration || ''}
                placeholder="30"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="content_type">Content Type</label>
            <select id="content_type" name="content_type" required>
              <option value="text" selected={editingLesson?.content_type === 'text'}>Text</option>
              <option value="video" selected={editingLesson?.content_type === 'video'}>Video</option>
              <option value="interactive" selected={editingLesson?.content_type === 'interactive'}>Interactive</option>
              <option value="quiz" selected={editingLesson?.content_type === 'quiz'}>Quiz</option>
              <option value="code" selected={editingLesson?.content_type === 'code'}>Code</option>
              <option value="svelte" selected={editingLesson?.content_type === 'svelte'}>Svelte Component</option>
            </select>
          </div>
          
          <!-- Content based on type -->
          <div class="content-section">
            {#if editingLesson?.content_type === 'svelte' || !editingLesson}
              <div class="form-group">
                <label for="svelte_file">Svelte Component File (.svelte)</label>
                <input 
                  type="file" 
                  id="svelte_file" 
                  name="svelte_file" 
                  accept=".svelte"
                  required={!editingLesson}
                />
                <small>Upload a .svelte file for interactive lessons</small>
              </div>
              
              <div class="form-group">
                <label for="component_props">Component Props (JSON)</label>
                <textarea 
                  id="component_props" 
                  name="component_props" 
                  rows="3"
                  placeholder={'"initialValue": "hello", "allowEdit": true'}
                >{editingLesson?.component_props ? JSON.stringify(editingLesson.component_props, null, 2) : ''}</textarea>
                <small>Optional JSON props to pass to the Svelte component</small>
              </div>
            {:else}
              <div class="form-group">
                <label for="content">Content</label>
                <textarea 
                  id="content" 
                  name="content" 
                  rows="6"
                  placeholder="Enter lesson content..."
                >{editingLesson?.content || ''}</textarea>
              </div>
            {/if}
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={() => showCreateLesson = false}>
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              {editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div
      class="modal-overlay"
      role="presentation"
      onclick={() => showDeleteConfirm = null}
      onkeydown={(e) => e.key === 'Escape' && (showDeleteConfirm = null)}
    >
      <div
        class="modal small"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h3>Delete Lesson</h3>
          <button class="close-btn" onclick={() => showDeleteConfirm = null}>×</button>
        </div>
        
        <div class="modal-content">
          <p>Are you sure you want to delete this lesson? This action cannot be undone.</p>
        </div>
        
        <form 
          method="POST" 
          action="?/deleteLesson"
          use:enhance={() => {
            return async ({ result }) => {
              handleDeleteResult(result);
            };
          }}
        >
          <input type="hidden" name="lessonId" value={showDeleteConfirm} />
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={() => showDeleteConfirm = null}>
              Cancel
            </button>
            <button type="submit" class="delete-btn">
              Delete Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .course-management {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .course-header {
    margin-bottom: 3rem;
  }
  
  .breadcrumb {
    margin-bottom: 1rem;
  }
  
  .breadcrumb a {
    color: #e96b00;
    text-decoration: none;
  }
  
  .breadcrumb a:hover {
    text-decoration: underline;
  }
  
  .course-header h1 {
    color: #e96b00;
    margin-bottom: 0.5rem;
  }
  
  .course-header p {
    color: #666;
    margin-bottom: 1.5rem;
  }
  
  .course-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .kit, .level, .theme, .status {
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 0.9rem;
  }
  
  .status.published {
    background: #4CAF50;
    color: white;
  }
  
  .status.draft {
    background: #FF9800;
    color: white;
  }
  
  .error-message {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .section-header h2 {
    color: #e96b00;
    margin: 0;
  }
  
  .create-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .create-btn:hover {
    background: #45a049;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: #f9f9f9;
    border-radius: 8px;
  }
  
  .lessons-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .lesson-card {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s;
  }
  
  .lesson-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .lesson-info {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .lesson-number {
    background: #e96b00;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    font-weight: bold;
  }
  
  .lesson-details h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .lesson-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .content-type, .duration, .status {
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }
  
  .lesson-actions {
    display: flex;
    gap: 10px;
  }
  
  .edit-btn, .delete-btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .edit-btn:hover {
    background: #f5f5f5;
  }
  
  .delete-btn {
    color: #f44336;
    border-color: #f44336;
  }
  
  .delete-btn:hover {
    background: #f44336;
    color: white;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    max-width: 700px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal.small {
    max-width: 500px;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .modal-header h3 {
    margin: 0;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .modal-content {
    margin-bottom: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-group textarea {
    resize: vertical;
  }
  
  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
  }
  
  .content-section {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: #f9f9f9;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .cancel-btn {
    padding: 10px 20px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .submit-btn {
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .submit-btn:hover {
    background: #45a049;
  }

  /* File management */
  .lesson-card {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .file-count {
    background: var(--secondary-background, #f5f5f5);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--muted, #666);
  }

  .files-btn {
    padding: 6px 12px;
    border: 1px solid var(--color-primary, #7476fc);
    background: transparent;
    color: var(--color-primary, #7476fc);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .files-btn:hover {
    background: var(--color-primary, #7476fc);
    color: white;
  }

  .files-panel {
    margin-top: 1rem;
    padding: 1rem;
    border-top: 1px solid var(--border, #eee);
    background: var(--secondary-background, #f9f9f9);
    border-radius: 0 0 6px 6px;
  }

  .files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .files-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text, #333);
  }

  .upload-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 6px 14px;
    background: var(--color-primary, #7476fc);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: opacity 0.15s;
  }

  .upload-label:hover {
    opacity: 0.88;
  }

  .file-input-hidden {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }

  .uploading {
    font-style: italic;
    font-size: 0.875rem;
  }

  .upload-error {
    color: #dc3545;
    font-size: 0.85rem;
    margin: 0.25rem 0 0.75rem;
  }

  .no-files-hint {
    color: var(--muted, #888);
    font-size: 0.875rem;
    font-style: italic;
    margin: 0;
  }

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: var(--color-background, #fff);
    border: 1px solid var(--border, #eee);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .file-type-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .file-type-badge.markdown { background: #dbeafe; color: #1d4ed8; }
  .file-type-badge.video    { background: #fce7f3; color: #9d174d; }
  .file-type-badge.svelte   { background: #fef3c7; color: #92400e; }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text, #333);
  }

  .remove-file-btn {
    padding: 2px 8px;
    border: 1px solid #dc3545;
    background: transparent;
    color: #dc3545;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .remove-file-btn:hover {
    background: #dc3545;
    color: white;
  }
</style> 