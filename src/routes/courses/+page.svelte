<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { Kit, OfficialCourse, CustomCourse } from '$lib/types/courses';

  const { data, form } = $props();
  const { kits, officialCourses, customCourses, selectedKit, userKits, userCourses, canCreateCourses, error } = data;

  // Active section tab
  let activeTab = $state<'official' | 'community' | 'mine'>('official');
  let showNewCourseForm = $state(false);
  
  // Ensure userKits is typed as string array
  const userKitIds: string[] = userKits || [];
  
  // Search and filter state
  let searchQuery = $state('');
  let selectedLevel = $state('all');
  let sortBy = $state('name');
  
  // Available filters
  const levels = ['all', ...Array.from(new Set(kits.map(kit => kit.level)))];
  
  // Filtered and sorted courses
  const filteredOfficialCourses = $derived(officialCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.theme.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === parseInt(selectedLevel);
    
    return matchesSearch && matchesLevel;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'level':
        return a.level - b.level;
      case 'theme':
        return a.theme.localeCompare(b.theme);
      default:
        return 0;
    }
  }));
  
  const filteredCustomCourses = $derived(customCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === parseInt(selectedLevel);
    
    return matchesSearch && matchesLevel;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'level':
        return a.level - b.level;
      default:
        return 0;
    }
  }));
  
  function filterByKit(kitId: string | null) {
    const url = new URL(window.location.href);
    if (kitId) {
      url.searchParams.set('kit', kitId);
    } else {
      url.searchParams.delete('kit');
    }
    goto(url.toString());
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedLevel = 'all';
    sortBy = 'name';
  }
</script>

<div class="courses-page">
  <div class="page-header">
    <h1>Electrofun Courses</h1>
    <p>Master electronics through interactive lessons and hands-on projects. Choose from official courses or explore community-created content.</p>
  </div>
  
  {#if error}
    <div class="error">{error}</div>
  {:else if userKitIds.length === 0}
    <div class="no-access">
      <h2>No Kit Access</h2>
      <p>You need to purchase a kit to access courses. Visit our shop to get started!</p>
      <a href="/shop" class="button">Go to Shop</a>
    </div>
  {:else}
    <!-- Section tabs -->
    <div class="section-tabs">
      <button
        class="section-tab"
        class:active={activeTab === 'official'}
        onclick={() => activeTab = 'official'}
      >Official Courses</button>
      <button
        class="section-tab"
        class:active={activeTab === 'community'}
        onclick={() => activeTab = 'community'}
      >Community</button>
      {#if canCreateCourses}
        <button
          class="section-tab my-courses-tab"
          class:active={activeTab === 'mine'}
          onclick={() => activeTab = 'mine'}
        >My Courses {#if userCourses?.length > 0}<span class="tab-count">{userCourses.length}</span>{/if}</button>
      {/if}
    </div>

    {#if activeTab === 'mine'}
      <!-- ── My Courses section ───────────────── -->
      <div class="my-courses-section">
        <div class="my-courses-header">
          <h2>My Courses</h2>
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
            <div class="ncf-check">
              <label>
                <input type="checkbox" name="isPublic" value="true" />
                Make this course public (visible to all users with the required kit)
              </label>
            </div>
            <button type="submit" class="btn-create-course">Create & Open Editor</button>
          </form>
        {/if}

        {#if !userCourses || userCourses.length === 0}
          <div class="empty-my-courses">
            <p>You haven't created any courses yet.</p>
            <p>Click <strong>+ New Course</strong> to get started.</p>
          </div>
        {:else}
          <div class="my-courses-grid">
            {#each userCourses as course}
              <div class="my-course-card">
                <div class="mc-header">
                  <div class="mc-badges">
                    <span class="mc-badge {course.is_published ? 'published' : 'draft'}">
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span class="mc-badge {course.is_public ? 'public' : 'private'}">
                      {course.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
                <h3 class="mc-title">{course.title}</h3>
                <p class="mc-desc">{course.description}</p>
                {#if course.kits}
                  <p class="mc-kit">{course.kits.name} · Level {course.kits.level}</p>
                {/if}
                <div class="mc-actions">
                  <a href="/create-course/{course.id}" class="btn-edit-course">Edit Course</a>
                  {#if course.is_published}
                    <a href="/courses/community/{course.id}" class="btn-view-course">View</a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
    <!-- Kit Filter -->
    <div class="kit-filter">
      <button 
        class="filter-btn" 
        class:active={selectedKit === null}
        onclick={() => filterByKit(null)}
      >
        All Kits
      </button>
      {#each kits as kit}
        {#if userKitIds.includes(kit.id)}
          <button 
            class="filter-btn" 
            class:active={selectedKit === kit.id}
            onclick={() => filterByKit(kit.id)}
          >
            {kit.name} (Level {kit.level})
          </button>
        {/if}
      {/each}
    </div>
    
    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search courses by title, description, or theme..."
          bind:value={searchQuery}
        />
      </div>
      
      <div class="filters">
        <select bind:value={selectedLevel}>
          {#each levels as level}
            <option value={level}>
              {level === 'all' ? 'All Levels' : `Level ${level}`}
            </option>
          {/each}
        </select>
        
        <select bind:value={sortBy}>
          <option value="name">Sort by Name</option>
          <option value="level">Sort by Level</option>
          <option value="theme">Sort by Theme</option>
        </select>
        
        <button onclick={clearFilters} class="clear-filters">
          Clear Filters
        </button>
      </div>
      
      <div class="results-count">
        {filteredOfficialCourses.length + filteredCustomCourses.length} course{(filteredOfficialCourses.length + filteredCustomCourses.length) !== 1 ? 's' : ''} found
      </div>
    </div>
    
    <!-- Official Courses -->
    <section class="courses-section">
      <h2>Official Courses</h2>
      {#if filteredOfficialCourses.length === 0}
        <p class="no-courses">No official courses available for the selected filters.</p>
      {:else}
        <div class="courses-grid">
          {#each filteredOfficialCourses as course}
            <div class="course-card official">
              <div class="course-image">
                <img src="/default-kit-image.jpg" alt={course.title} />
                <div class="course-overlay">
                  <span class="course-type">Official</span>
                  <span class="level-badge">Level {course.level}</span>
                </div>
              </div>
              <div class="course-content">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div class="meta">
                  <span class="theme">{course.theme}</span>
                  {#if course.estimated_duration}
                    <span class="duration">{course.estimated_duration} min</span>
                  {/if}
                </div>
                <a href="/courses/official/{course.id}" class="course-btn">Start Course</a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
    
    <!-- Custom Courses -->
    <section class="courses-section">
      <h2>Community Courses</h2>
      <p class="section-description">
        Discover courses created by the Electrofun community. 
        <a href="/shop/community-courses">Browse more community courses in our shop</a>.
      </p>
      {#if filteredCustomCourses.length === 0}
        <p class="no-courses">No community courses available for the selected filters.</p>
      {:else}
        <div class="courses-grid">
          {#each filteredCustomCourses as course}
            <div class="course-card custom">
              <div class="course-image">
                <img src="/default-kit-image.jpg" alt={course.title} />
                <div class="course-overlay">
                  <span class="course-type">Community</span>
                  <span class="level-badge">Level {course.level}</span>
                </div>
              </div>
              <div class="course-content">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div class="meta">
                  <span class="creator">By {course.creator?.full_name || course.creator?.email || 'Unknown'}</span>
                  {#if course.price > 0}
                    <span class="price">${course.price}</span>
                  {:else}
                    <span class="price free">Free</span>
                  {/if}
                </div>
                <a href="/courses/community/{course.id}" class="course-btn">View Course</a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
    {/if} <!-- end activeTab !== 'mine' -->
  {/if}
</div>

<style>
  .courses-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-header h1 {
    color: var(--primary-color);
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }
  
  .page-header p {
    color: var(--muted);
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .kit-filter {
    display: flex;
    gap: 10px;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  
  .filter-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 20px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .filter-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  
  .search-filters {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .search-bar {
    margin-bottom: 1rem;
  }
  
  .search-bar input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    font-size: 1rem;
  }
  
  .search-bar input:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  
  .filters select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--background);
    color: var(--text);
    font-size: 0.9rem;
  }
  
  .clear-filters {
    padding: 0.5rem 1rem;
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  .clear-filters:hover {
    background: var(--border);
  }
  
  .results-count {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .courses-section {
    margin-bottom: 3rem;
  }
  
  .courses-section h2 {
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  .section-description {
    color: var(--muted);
    margin-bottom: 1.5rem;
  }
  
  .section-description a {
    color: var(--primary-color);
    text-decoration: none;
  }
  
  .section-description a:hover {
    text-decoration: underline;
  }
  
  .no-courses {
    text-align: center;
    color: var(--muted);
    font-style: italic;
    padding: 2rem;
  }
  
  .no-access {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--secondary-background);
    border-radius: 12px;
    margin: 2rem 0;
  }
  
  .no-access h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }
  
  .no-access p {
    color: var(--muted);
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }
  
  .course-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;
    background: var(--surface);
  }
  
  .course-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
  
  .course-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }
  
  .course-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .course-card:hover .course-image img {
    transform: scale(1.05);
  }
  
  .course-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .course-type, .level-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .course-type {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
  
  .level-badge {
    background: var(--primary-color);
    color: white;
  }
  
  .course-content {
    padding: 1.5rem;
  }
  
  .course-card h3 {
    margin: 0 0 1rem 0;
    color: var(--text);
    font-size: 1.2rem;
  }
  
  .course-card p {
    color: var(--muted);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .meta {
    display: flex;
    gap: 10px;
    margin: 1rem 0;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }
  
  .theme, .duration, .creator {
    background: var(--secondary-background);
    padding: 2px 8px;
    border-radius: 12px;
    color: var(--muted);
  }
  
  .price {
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .price.free {
    color: var(--primary-color);
  }
  
  .course-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.3s;
    text-align: center;
    width: 100%;
  }
  
  .course-btn:hover {
    background: var(--primary-dark);
  }
  
  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.3s;
  }
  
  .button:hover {
    background: var(--primary-dark);
  }
  
  .error {
    text-align: center;
    padding: 2rem;
    color: white;
    background: var(--danger);
    border-radius: 8px;
  }

  /* ── Section tabs ─────────────────────────────── */
  .section-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0;
  }

  .section-tab {
    padding: 0.6rem 1.25rem;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.95rem;
    position: relative;
    bottom: -2px;
    transition: background 0.15s, color 0.15s;
  }

  .section-tab:hover:not(.active) {
    background: var(--secondary-background);
    color: var(--color-text);
  }

  .section-tab.active {
    background: var(--secondary-background);
    color: var(--color-text);
    border-color: var(--border);
    border-bottom-color: var(--secondary-background);
    font-weight: 600;
  }

  .my-courses-tab { font-style: normal; }

  .tab-count {
    background: var(--color-primary);
    color: white;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 0.75rem;
    font-weight: 700;
    margin-left: 4px;
  }

  /* ── My Courses section ───────────────────────── */
  .my-courses-section {
    padding: 0.5rem 0 2rem;
  }

  .my-courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .my-courses-header h2 {
    margin: 0;
    color: var(--color-text);
  }

  .btn-new-course {
    padding: 8px 18px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .btn-new-course:hover { opacity: 0.88; }

  .form-error-banner {
    background: rgba(220,53,69,0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .new-course-form {
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 10px;
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
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
  }

  .ncf-group input,
  .ncf-group select,
  .ncf-group textarea {
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .ncf-check label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
  }

  .btn-create-course {
    align-self: flex-start;
    padding: 9px 20px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .empty-my-courses {
    text-align: center;
    padding: 3rem;
    color: var(--muted);
    font-style: italic;
    background: var(--secondary-background);
    border-radius: 10px;
  }

  .my-courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .my-course-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
    background: var(--secondary-background);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: box-shadow 0.2s;
  }

  .my-course-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .mc-header { display: flex; justify-content: flex-end; }

  .mc-badges { display: flex; gap: 0.4rem; }

  .mc-badge {
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .mc-badge.published { background: #d1fae5; color: #065f46; }
  .mc-badge.draft     { background: #fef3c7; color: #92400e; }
  .mc-badge.public    { background: #dbeafe; color: #1d4ed8; }
  .mc-badge.private   { background: #f3e8ff; color: #6b21a8; }

  .mc-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .mc-desc {
    font-size: 0.875rem;
    color: var(--muted);
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .mc-kit {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0;
  }

  .mc-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .btn-edit-course, .btn-view-course {
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn-edit-course {
    background: var(--color-primary);
    color: white;
  }

  .btn-view-course {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--color-text);
  }

  .btn-edit-course:hover, .btn-view-course:hover { opacity: 0.82; }

  @media (max-width: 600px) {
    .ncf-row { grid-template-columns: 1fr; }
    .section-tabs { overflow-x: auto; }
  }
</style>