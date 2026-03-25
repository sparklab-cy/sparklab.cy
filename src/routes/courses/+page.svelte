<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { Kit, OfficialCourse, CustomCourse } from '$lib/types/courses';

  const { data, form } = $props();
  const { kits, officialCourses, userCourses, userKits, userRole, canCreateCourses, error } = data;

  const userKitIds: string[] = userKits || [];
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';

  let showNewCourseForm = $state(false);
</script>

<div class="courses-page">
  <header class="page-header animate-in">
    <h1>My Courses</h1>
    <p>Your unlocked courses, ready to learn.</p>
  </header>

  {#if error}
    <div class="error-banner">{error}</div>
  {:else if userKitIds.length === 0}
    <section class="empty-state">
      <h2>No kits yet</h2>
      <p>Purchase a kit to unlock your first courses and start building.</p>
      <a href="/shop" class="cta-btn">Go to Shop</a>
    </section>
  {:else}
    {#if officialCourses.length === 0}
      <section class="empty-state">
        <h2>No courses available</h2>
        <p>There are no published courses for your kits yet. Check back soon.</p>
      </section>
    {:else}
      <section class="courses-grid">
        {#each officialCourses as course, idx}
          <a href="/courses/official/{course.id}" class="course-card animate-in delay-{(idx % 5) + 1}">
            <div class="card-top">
              <span class="level-badge">Level {course.level}</span>
              <span class="theme-badge">{course.theme}</span>
            </div>
            <h2>{course.title}</h2>
            <p class="course-desc">{course.description}</p>
            <div class="card-footer">
              {#if course.estimated_duration}
                <span class="duration">{course.estimated_duration} min</span>
              {/if}
              <span class="start-label">Start Course</span>
            </div>
          </a>
        {/each}
      </section>
    {/if}

    {#if canCreateCourses}
      <section class="my-courses-section">
        <div class="my-courses-header">
          <h2>Created by You</h2>
          <button class="btn-new-course" onclick={() => showNewCourseForm = !showNewCourseForm}>
            {showNewCourseForm ? 'Cancel' : '+ New Course'}
          </button>
        </div>

        {#if form?.error}
          <p class="form-error-banner">{form.error}</p>
        {/if}

        {#if showNewCourseForm}
          <form
            method="POST"
            action="?/createCourse"
            class="new-course-form"
            use:enhance
          >
            <div class="ncf-row">
              <div class="ncf-group">
                <label for="ncf-title">Title</label>
                <input id="ncf-title" type="text" name="title" required placeholder="Course title" />
              </div>
              <div class="ncf-group">
                <label for="ncf-kit">Kit</label>
                <select id="ncf-kit" name="kitId" required>
                  {#each kits.filter(k => userKitIds.includes(k.id)) as kit}
                    <option value={kit.id}>{kit.name} (Level {kit.level})</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="ncf-group">
              <label for="ncf-desc">Description</label>
              <textarea id="ncf-desc" name="description" rows="2" required placeholder="What will students learn?"></textarea>
            </div>
            <button type="submit" class="btn-create-course">Create & Open Editor</button>
          </form>
        {/if}

        {#if !userCourses || userCourses.length === 0}
          <div class="empty-created">
            <p>You haven't created any courses yet. Click <strong>+ New Course</strong> to start.</p>
          </div>
        {:else}
          <div class="created-grid">
            {#each userCourses as course}
              <div class="created-card">
                <div class="cc-badges">
                  {#if isAdmin}
                    <span class="cc-badge {course.is_published ? 'published' : 'draft'}">
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  {/if}
                  <span class="cc-badge invite-only">Invite Only</span>
                </div>
                <h3>{course.title}</h3>
                <p class="cc-desc">{course.description}</p>
                {#if course.kits}
                  <p class="cc-kit">{course.kits.name} &middot; Level {course.kits.level}</p>
                {/if}
                <div class="cc-actions">
                  <a href="/create-course/{course.id}" class="btn-edit">Edit</a>
                  {#if isAdmin && course.is_published}
                    <a href="/courses/community/{course.id}" class="btn-view">View</a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .courses-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 2rem 4rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .page-header h1 {
    margin: 0 0 0.5rem;
    font-size: var(--font-size-h1);
    color: var(--color-text);
  }

  .page-header p {
    margin: 0;
    color: var(--muted);
    font-size: 1rem;
  }

  .error-banner {
    text-align: center;
    padding: 1.25rem;
    border-radius: var(--radius);
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .empty-state h2 {
    margin: 0 0 0.6rem;
    color: var(--color-text);
  }

  .empty-state p {
    margin: 0 0 1.5rem;
    color: var(--muted);
    line-height: 1.7;
  }

  .cta-btn {
    display: inline-block;
    padding: 0.75rem 1.8rem;
    border-radius: 999px;
    background: var(--color-primary);
    color: #fff;
    text-decoration: none;
    font-weight: 800;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(116, 118, 252, 0.25);
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .course-card {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s ease;
  }

  .course-card:hover {
    border-color: color-mix(in srgb, var(--color-primary) 55%, var(--border));
  }

  .card-top {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.85rem;
  }

  .level-badge,
  .theme-badge {
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .level-badge {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 40%, var(--border));
    color: var(--color-primary);
  }

  .theme-badge {
    background: color-mix(in srgb, var(--color-secondary) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-secondary) 35%, var(--border));
    color: var(--color-secondary);
    text-transform: capitalize;
  }

  .course-card h2 {
    margin: 0 0 0.45rem;
    font-size: 1.15rem;
    color: var(--color-text);
  }

  .course-desc {
    margin: 0 0 auto;
    color: var(--muted);
    line-height: 1.65;
    font-size: 0.92rem;
    padding-bottom: 1rem;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.85rem;
    border-top: 1px solid rgba(128, 128, 128, 0.12);
  }

  .duration {
    font-size: 0.82rem;
    color: var(--muted);
    font-weight: 700;
  }

  .start-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--color-primary);
  }

  /* ── Created by You ───────────────────────── */
  .my-courses-section {
    margin-top: 3.5rem;
    padding-top: 3rem;
    border-top: 1px solid var(--border);
  }

  .my-courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .my-courses-header h2 {
    margin: 0;
    font-size: var(--font-size-h2);
    color: var(--color-text);
  }

  .btn-new-course {
    padding: 0.5rem 1.1rem;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 800;
    font-size: 0.9rem;
  }

  .btn-new-course:hover { opacity: 0.88; }

  .form-error-banner {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .new-course-form {
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .ncf-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .ncf-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ncf-group label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
  }

  .ncf-group input,
  .ncf-group select,
  .ncf-group textarea {
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .ncf-group input:focus,
  .ncf-group select:focus,
  .ncf-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .btn-create-course {
    align-self: flex-start;
    padding: 0.55rem 1.2rem;
    background: var(--color-primary);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 800;
    font-size: 0.9rem;
  }

  .empty-created {
    text-align: center;
    padding: 2.5rem;
    color: var(--muted);
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .created-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .created-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.15rem;
    background: var(--secondary-background);
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .cc-badges {
    display: flex;
    gap: 0.4rem;
  }

  .cc-badge {
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .cc-badge.published   { background: #d1fae5; color: #065f46; }
  .cc-badge.draft       { background: #fef3c7; color: #92400e; }
  .cc-badge.invite-only { background: #dbeafe; color: #1d4ed8; }

  .created-card h3 {
    margin: 0.3rem 0 0;
    font-size: 1rem;
    color: var(--color-text);
  }

  .cc-desc {
    margin: 0;
    font-size: 0.88rem;
    color: var(--muted);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .cc-kit {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0;
  }

  .cc-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }

  .btn-edit, .btn-view {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-edit {
    background: var(--color-primary);
    color: #fff;
  }

  .btn-view {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--color-text);
  }

  .btn-edit:hover, .btn-view:hover { opacity: 0.82; }

  @media (max-width: 640px) {
    .courses-page { padding: 2rem 1.25rem 3rem; }
    .ncf-row { grid-template-columns: 1fr; }
    .courses-grid { grid-template-columns: 1fr; }
  }
</style>
