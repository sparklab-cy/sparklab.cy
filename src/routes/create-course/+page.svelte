<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Kit, CustomCourse } from '$lib/types/courses';

  const { data, form } = $props();
  const { kits, userCourses, error } = data;

  let showCreateForm = $state(false);
  let editingCourse: CustomCourse | null = $state(null);

  function openCreateForm() {
    showCreateForm = true;
    editingCourse = null;
  }

  function editCourse(course: CustomCourse) {
    editingCourse = course;
    showCreateForm = true;
  }

  function closeForm() {
    showCreateForm = false;
    editingCourse = null;
  }

  function handleFormResult(result: any) {
    if (result.type === 'success') {
      closeForm();
      window.location.reload();
    }
  }
</script>

<div class="create-course-page">
  <header class="page-header">
    <h1>My Courses</h1>
    <p>Create and manage courses for the Electrofun community</p>
    <a href="/courses" class="back-link">← Back to Courses</a>
  </header>

  {#if form?.message}
    <div class="success">{form.message}</div>
  {/if}

  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  {#if error}
    <div class="error">{error}</div>
  {:else if kits.length === 0}
    <div class="no-kits">
      <h2>No Kit Access</h2>
      <p>You need to purchase a kit to create community courses.</p>
      <a href="/shop" class="button">Go to Shop</a>
    </div>
  {:else}
    <div class="content">
      <section class="section">
        <div class="section-header">
          <h2>Create New Course</h2>
          <button class="btn-primary" onclick={openCreateForm}>+ Create Course</button>
        </div>
      </section>

      <section class="section">
        <h2>Your Courses</h2>

        {#if userCourses.length === 0}
          <div class="empty-state">
            <p>You haven't created any courses yet. Click "Create Course" to get started!</p>
          </div>
        {:else}
          <div class="courses-grid">
            {#each userCourses as course}
              <div class="course-card">
                <div class="course-header">
                  <h3>{course.title}</h3>
                  <div class="status-badges">
                    {#if course.is_published}
                      <span class="status published">Published</span>
                    {:else}
                      <span class="status draft">Draft</span>
                    {/if}
                    {#if course.is_public}
                      <span class="status public">Public</span>
                    {:else}
                      <span class="status private">Private</span>
                    {/if}
                  </div>
                </div>

                <p class="description">{course.description}</p>

                <div class="course-meta">
                  <span class="price">{course.price > 0 ? `$${course.price}` : 'Free'}</span>
                  {#if course.estimated_duration}
                    <span class="duration">{course.estimated_duration} min</span>
                  {/if}
                </div>

                <div class="course-actions">
                  <button class="btn-secondary" onclick={() => editCourse(course)}>
                    Edit Details
                  </button>
                  <a href="/create-course/{course.id}" class="btn-primary">
                    Manage Lessons
                  </a>
                  {#if course.is_published}
                    <a href="/courses/community/{course.id}" class="btn-secondary">
                      View
                    </a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</div>

<!-- Create/Edit Course Modal -->
{#if showCreateForm}
  <div
    class="modal-overlay"
    role="presentation"
    onclick={closeForm}
    onkeydown={(e) => e.key === 'Escape' && closeForm()}
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>

      <form
        method="POST"
        action={editingCourse ? "?/updateCourse" : "?/createCourse"}
        use:enhance={() => {
          return async ({ result }) => handleFormResult(result);
        }}
      >
        {#if editingCourse}
          <input type="hidden" name="courseId" value={editingCourse.id} />
        {/if}

        <div class="form-group">
          <label for="title">Course Title</label>
          <input type="text" id="title" name="title" value={editingCourse?.title || ''} required />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="4" required>{editingCourse?.description || ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="kitId">Kit</label>
            <select id="kitId" name="kitId" required>
              {#each kits as kit}
                <option value={kit.id} selected={editingCourse?.kit_id === kit.id}>
                  {kit.name} (Level {kit.level})
                </option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="price">Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={editingCourse?.price || 0}
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPublic"
                value="true"
                checked={editingCourse?.is_public ?? true}
              />
              Public (visible to all users with the kit)
            </label>
          </div>

          {#if editingCourse}
            <div class="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublished"
                  value="true"
                  checked={editingCourse?.is_published ?? false}
                />
                Published
              </label>
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="estimatedDuration">Estimated Duration (minutes)</label>
          <input
            type="number"
            id="estimatedDuration"
            name="estimatedDuration"
            min="1"
            value={editingCourse?.estimated_duration || ''}
            placeholder="e.g. 60"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick={closeForm}>Cancel</button>
          <button type="submit" class="btn-primary">
            {editingCourse ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .create-course-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    color: var(--color-primary);
    margin-bottom: 0.5rem;
    font-size: 2rem;
  }

  .page-header p { color: var(--muted); margin-bottom: 0.5rem; }

  .back-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover { text-decoration: underline; }

  .success {
    background: #d1fae5;
    color: #065f46;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .error {
    background: rgba(220,53,69,0.1);
    color: var(--danger);
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    text-align: center;
  }

  .no-kits {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--secondary-background);
    border-radius: 10px;
  }

  .content { display: flex; flex-direction: column; gap: 2rem; }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h2, .section h2 {
    color: var(--color-text);
    margin: 0 0 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--muted);
    font-style: italic;
    background: var(--secondary-background);
    border-radius: 8px;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.5rem;
  }

  .course-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem;
    background: var(--secondary-background);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: box-shadow 0.2s;
  }

  .course-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .course-header h3 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.05rem;
  }

  .status-badges { display: flex; gap: 0.3rem; flex-wrap: wrap; flex-shrink: 0; }

  .status {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .status.published { background: #d1fae5; color: #065f46; }
  .status.draft     { background: #fef3c7; color: #92400e; }
  .status.public    { background: #dbeafe; color: #1d4ed8; }
  .status.private   { background: #f3e8ff; color: #6b21a8; }

  .description {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .course-meta { display: flex; gap: 0.5rem; }

  .price, .duration {
    background: var(--color-background);
    border: 1px solid var(--border);
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .course-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }

  .btn-primary, .btn-secondary {
    padding: 7px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    border: none;
    transition: opacity 0.15s;
  }

  .btn-primary { background: var(--color-primary); color: white; }
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--color-text);
  }

  .btn-primary:hover, .btn-secondary:hover { opacity: 0.82; }

  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 1rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--color-background);
    border-radius: 10px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border);
  }

  .modal h2 { margin: 0 0 1.5rem; color: var(--color-text); }

  .form-group { margin-bottom: 1.25rem; }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    margin-bottom: 0;
    font-size: 0.875rem;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 9px 11px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--secondary-background);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .form-group textarea { resize: vertical; }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  @media (max-width: 600px) {
    .form-row { grid-template-columns: 1fr; }
    .courses-grid { grid-template-columns: 1fr; }
  }
</style>
