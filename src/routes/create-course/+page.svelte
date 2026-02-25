<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
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
      // Refresh the page to show changes
      window.location.reload();
    }
  }
</script>

<div class="create-course-page">
  <header class="page-header">
    <h1>Create Community Course</h1>
    <p>Share your knowledge by creating courses for the Electrofun community</p>
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
      <p>You need to purchase a kit to create community courses. Visit our shop to get started!</p>
      <a href="/shop" class="button">Go to Shop</a>
    </div>
  {:else}
    <div class="content">
      <!-- Create Course Section -->
      <section class="section">
        <div class="section-header">
          <h2>Create New Course</h2>
          <button class="btn-primary" on:click={openCreateForm}>+ Create Course</button>
        </div>
        
        <div class="info-card">
          <h3>Course Creation Guidelines</h3>
          <ul>
            <li>You can only create courses for kits you own</li>
            <li>Courses start as drafts - you can publish them when ready</li>
            <li>Free courses are available to all users with the required kit</li>
            <li>Paid courses require users to purchase access</li>
            <li>Make sure your content is educational and appropriate</li>
          </ul>
        </div>
      </section>

      <!-- User's Courses Section -->
      <section class="section">
        <h2>Your Courses</h2>
        
        {#if userCourses.length === 0}
          <div class="empty-state">
            <p>You haven't created any courses yet. Start by creating your first course!</p>
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
                  <span class="price">
                    {#if course.price > 0}
                      ${course.price}
                    {:else}
                      Free
                    {/if}
                  </span>
                  {#if course.estimated_duration}
                    <span class="duration">{course.estimated_duration} min</span>
                  {/if}
                </div>
                
                <div class="course-actions">
                  <button class="btn-secondary" on:click={() => editCourse(course)}>
                    Edit Course
                  </button>
                  <a href="/courses/community/{course.id}" class="btn-secondary">
                    View Course
                  </a>
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
  <div class="modal-overlay" on:click={closeForm}>
    <div class="modal" on:click|stopPropagation>
      <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
      
      <form 
        method="POST" 
        action={editingCourse ? "?/updateCourse" : "?/createCourse"} 
        use:enhance={handleFormResult}
      >
        {#if editingCourse}
          <input type="hidden" name="courseId" value={editingCourse.id} />
        {/if}
        
        <div class="form-group">
          <label for="title">Course Title</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            value={editingCourse?.title || ''}
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            name="description" 
            rows="4" 
            required
          >{editingCourse?.description || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="kitId">Kit</label>
            <select id="kitId" name="kitId" required>
              {#each kits as kit}
                <option 
                  value={kit.id} 
                  selected={editingCourse?.kit_id === kit.id}
                >
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
              step="0.01" 
              min="0" 
              value={editingCourse?.price || 0}
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="estimatedDuration">Estimated Duration (minutes)</label>
            <input 
              type="number" 
              id="estimatedDuration" 
              name="estimatedDuration" 
              min="1" 
              value={editingCourse?.estimated_duration || ''}
            />
          </div>
          
          <div class="form-group">
            <label for="isPublic">Visibility</label>
            <select id="isPublic" name="isPublic">
              <option value="true" selected={editingCourse?.is_public}>Public</option>
              <option value="false" selected={!editingCourse?.is_public}>Private</option>
            </select>
          </div>
        </div>
        
        {#if editingCourse}
          <div class="form-group">
            <label for="isPublished">Publication Status</label>
            <select id="isPublished" name="isPublished">
              <option value="true" selected={editingCourse?.is_published}>Published</option>
              <option value="false" selected={!editingCourse?.is_published}>Draft</option>
            </select>
          </div>
        {/if}
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={closeForm}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            {editingCourse ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .create-course-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .page-header p {
    color: #666;
  }
  
  .success {
    background: #e8f5e8;
    color: #2e7d32;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .error {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .no-kits {
    text-align: center;
    padding: 4rem 2rem;
    background: #f9f9f9;
    border-radius: 12px;
  }
  
  .no-kits h2 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  .no-kits p {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .section {
    margin-bottom: 3rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .section-header h2 {
    color: #333;
    margin: 0;
  }
  
  .info-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .info-card h3 {
    color: #333;
    margin: 0 0 1rem 0;
  }
  
  .info-card ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #666;
  }
  
  .info-card li {
    margin-bottom: 0.5rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-style: italic;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .course-card {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s;
  }
  
  .course-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .course-header h3 {
    margin: 0;
    color: #333;
    flex: 1;
  }
  
  .status-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .status {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: bold;
  }
  
  .status.published {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  .status.draft {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .status.public {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .status.private {
    background: #f5f5f5;
    color: #666;
  }
  
  .description {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .course-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .price {
    font-weight: bold;
    color: #012d58;
  }
  
  .duration {
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 12px;
    color: #666;
  }
  
  .course-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-primary, .btn-secondary {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    transition: all 0.3s;
  }
  
  .btn-primary {
    background: #012d58;
    color: white;
  }
  
  .btn-primary:hover {
    background: #001021;
  }
  
  .btn-secondary {
    background: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .btn-secondary:hover {
    background: #e5e5e5;
  }
  
  .button {
    display: inline-block;
    padding: 12px 24px;
    background: #012d58;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    transition: background 0.3s;
  }
  
  .button:hover {
    background: #001021;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }
  
  .form-group {
    margin-bottom: 1rem;
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
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
  }
  
  .form-group textarea {
    resize: vertical;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  @media (max-width: 768px) {
    .create-course-page {
      padding: 1rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .modal {
      padding: 1.5rem;
    }
    
    .course-actions {
      flex-direction: column;
    }
  }
</style> 