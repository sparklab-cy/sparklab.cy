<script lang="ts">
  import { enhance } from '$app/forms';
  import type { CustomCourse } from '$lib/types/courses';
  
  const { data, form } = $props();
  const { communityCourses, userKits, error } = data;
  
  // Ensure userKits is typed as string array
  const userKitIds: string[] = userKits || [];
  
  // Search and filter state
  let searchQuery = $state('');
  let selectedKit = $state('all');
  let selectedPrice = $state('all');
  let sortBy = $state('newest');
  
  // Available filters
  const kits = ['all', ...Array.from(new Set(communityCourses.map(course => course.kits?.name).filter(Boolean)))];
  const priceRanges = ['all', 'free', 'paid'];
  
  // Filtered and sorted courses
  const filteredCourses = $derived(communityCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.kits?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKit = selectedKit === 'all' || course.kits?.name === selectedKit;
    const matchesPrice = selectedPrice === 'all' || 
                        (selectedPrice === 'free' && course.price === 0) ||
                        (selectedPrice === 'paid' && course.price > 0);
    
    return matchesSearch && matchesKit && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'duration':
        return (a.estimated_duration || 0) - (b.estimated_duration || 0);
      default:
        return 0;
    }
  }));
  
  function hasKitAccess(kitId: string): boolean {
    return userKitIds.includes(kitId);
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedKit = 'all';
    selectedPrice = 'all';
    sortBy = 'newest';
  }
</script>

<div class="community-courses-page">
  <div class="page-header">
    <h1>Community Courses</h1>
    <p>Discover amazing courses created by the Electrofun community. Learn from fellow makers and share your knowledge.</p>
  </div>
  
  {#if form?.message}
    <div class="success">{form.message}</div>
  {/if}
  
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}
  
  {#if error}
    <div class="error">{error}</div>
  {:else}
    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="search-bar">
        <input 
          type="text" 
          placeholder="Search courses by title, description, or kit..."
          bind:value={searchQuery}
        />
      </div>
      
      <div class="filters">
        <select bind:value={selectedKit}>
          {#each kits as kit}
            <option value={kit}>
              {kit === 'all' ? 'All Kits' : kit}
            </option>
          {/each}
        </select>
        
        <select bind:value={selectedPrice}>
          {#each priceRanges as range}
            <option value={range}>
              {range === 'all' ? 'All Prices' : range === 'free' ? 'Free' : 'Paid'}
            </option>
          {/each}
        </select>
        
        <select bind:value={sortBy}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="title">Sort by Title</option>
          <option value="duration">Sort by Duration</option>
        </select>
        
        <button on:click={clearFilters} class="clear-filters">
          Clear Filters
        </button>
      </div>
      
      <div class="results-count">
        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
      </div>
    </div>
    
    <!-- Courses Grid -->
    <div class="courses-grid">
      {#each filteredCourses as course}
        <div class="course-card">
          <div class="course-image">
            <img src={course.kits?.image_url || '/default-kit-image.jpg'} alt={course.kits?.name || 'Kit'} />
            <div class="course-overlay">
              <span class="kit-badge">{course.kits?.name}</span>
              <span class="level-badge">Level {course.kits?.level}</span>
            </div>
          </div>
          
          <div class="course-content">
            <div class="course-header">
              <h3>{course.title}</h3>
              <div class="course-meta">
                {#if course.estimated_duration}
                  <span class="duration">{course.estimated_duration} min</span>
                {/if}
                <span class="price">
                  {#if course.price > 0}
                    ${course.price}
                  {:else}
                    Free
                  {/if}
                </span>
              </div>
            </div>
            
            <p class="description">{course.description}</p>
            
            <div class="course-footer">
              {#if hasKitAccess(course.kit_id)}
                <a href="/courses/{course.id}" class="access-btn">Access Course</a>
              {:else}
                <div class="kit-required">
                  <p>Requires {course.kits?.name} kit</p>
                  <form method="POST" action="?/purchaseKit" use:enhance>
                    <input type="hidden" name="kitId" value={course.kit_id} />
                    <button type="submit" class="purchase-btn">
                      Purchase Kit
                    </button>
                  </form>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    {#if filteredCourses.length === 0}
      <div class="no-results">
        <h3>No courses found</h3>
        <p>Try adjusting your search or filters to find what you're looking for.</p>
        <button on:click={clearFilters} class="clear-filters">Clear All Filters</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .community-courses-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .page-header h1 {
    color: var(--color-primary);
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }
  
  .page-header p {
    color: var(--muted);
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .search-filters {
    background: var(--secondary-background);
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
    background: var(--color-background);
    color: var(--color-text);
    font-size: 1rem;
  }
  
  .search-bar input:focus {
    outline: 2px solid var(--color-primary);
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
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.9rem;
  }
  
  .clear-filters {
    padding: 0.5rem 1rem;
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--color-text);
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
    background: var(--secondary-background);
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
  
  .kit-badge, .level-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .kit-badge {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
  
  .level-badge {
    background: var(--color-primary);
    color: white;
  }
  
  .course-content {
    padding: 1.5rem;
  }
  
  .course-header {
    margin-bottom: 1rem;
  }
  
  .course-header h3 {
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  .course-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }
  
  .duration {
    background: var(--secondary-background);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: var(--muted);
  }
  
  .price {
    color: var(--color-primary);
    font-weight: 500;
  }
  
  .description {
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }
  
  .course-footer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .access-btn {
    display: block;
    padding: 0.75rem 1rem;
    background: var(--color-primary);
    color: white;
    text-decoration: none;
    text-align: center;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .access-btn:hover {
    background: var(--color-accent);
  }
  
  .kit-required {
    text-align: center;
    padding: 1rem;
    background: var(--secondary-background);
    border-radius: 8px;
  }
  
  .kit-required p {
    margin: 0 0 0.5rem 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .purchase-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .purchase-btn:hover {
    background: var(--color-accent);
  }
  
  .no-results {
    text-align: center;
    padding: 3rem;
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  
  .no-results h3 {
    color: var(--color-text);
    margin-bottom: 1rem;
  }
  
  .no-results p {
    color: var(--muted);
    margin-bottom: 1.5rem;
  }
  
  .error {
    background: var(--danger);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .success {
    background: var(--color-primary);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  @media (max-width: 768px) {
    .community-courses-page {
      padding: 1rem;
    }
    
    .page-header h1 {
      font-size: 2rem;
    }
    
    .courses-grid {
      grid-template-columns: 1fr;
    }
    
    .filters {
      flex-direction: column;
    }
  }
</style> 