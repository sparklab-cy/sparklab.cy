<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import { cart } from '$lib/stores/cart';
  import type { Kit, CustomCourse } from '$lib/types/courses';
  
  const { data, form } = $props();
  const { kits, userKits, error } = data;
  
  // Ensure userKits is typed as string array
  const userKitIds: string[] = userKits || [];
  

  // Search and filter state
  let searchQuery = $state('');
  let selectedLevel = $state('all');
  let selectedTheme = $state('all');
  let sortBy = $state('name');
  
  // Available filters
  const levels = ['all', ...Array.from(new Set(kits.map(kit => kit.level)))];
  const themes = ['all', ...Array.from(new Set(kits.map(kit => kit.theme)))];
  
  // Filtered and sorted kits
  const filteredKits = $derived(kits.filter(kit => {
    const matchesSearch = kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         kit.theme.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || kit.level === parseInt(selectedLevel);
    const matchesTheme = selectedTheme === 'all' || kit.theme === selectedTheme;
    
    return matchesSearch && matchesLevel && matchesTheme;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'level':
        return a.level - b.level;
      default:
        return 0;
    }
  }));
  
  function addToCart(kit: Kit) {
    cart.addItem({
      id: kit.id,
      type: 'kit',
      name: kit.name,
      price: kit.price,
      image: kit.image_url,
      description: kit.description
    });
  }
  
  function purchaseCommunityCourse(courseId: string) {
    // TODO: Implement payment logic
    alert(`Purchase flow for community course ${courseId} - Payment integration needed`);
  }
  
  function hasKitAccess(kitId: string): boolean {
    return userKitIds.includes(kitId);
  }
  
  function clearFilters() {
    searchQuery = '';
    selectedLevel = 'all';
    selectedTheme = 'all';
    sortBy = 'name';
  }
</script>

<div class="shop-page">
  <h1>Electrofun Shop</h1>
  
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
          placeholder="Search kits by name, description, or theme..."
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
        
        <select bind:value={selectedTheme}>
          {#each themes as theme}
            <option value={theme}>
              {theme === 'all' ? 'All Themes' : theme}
            </option>
          {/each}
        </select>
        
        <select bind:value={sortBy}>
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="level">Sort by Level</option>
        </select>
        
        <button on:click={clearFilters} class="clear-filters">
          Clear Filters
        </button>
      </div>
      
      <div class="results-count">
        {filteredKits.length} kit{filteredKits.length !== 1 ? 's' : ''} found
      </div>
    </div>
    
    <!-- Kits Section -->
    <section class="shop-section">
      <h2>Available Kits</h2>
      <p>Purchase kits to unlock official courses and create your own community courses.</p>
      
      <div class="kits-grid">
        {#each filteredKits as kit}
          <div class="kit-card">
            <div class="kit-image">
              <img src={kit.image_url || '/default-kit-image.jpg'} alt={kit.name} />
            </div>
            <div class="kit-content">
              <div class="kit-header">
                <h3>{kit.name}</h3>
                <span class="level">Level {kit.level}</span>
              </div>
              <p class="theme">{kit.theme}</p>
              <p class="description">{kit.description}</p>
              <div class="price">${kit.price}</div>
              
              <div class="kit-actions">
                <a href="/shop/{kit.id}" class="view-details-btn">View Details</a>
                
                {#if hasKitAccess(kit.id)}
                  <div class="owned-badge">✓ Owned</div>
                {:else}
                  <div class="purchase-options">
                    <button 
                      type="button" 
                      class="add-to-cart-btn"
                      on:click={() => addToCart(kit)}
                    >
                      Add to Cart
                    </button>
                    <form method="POST" action="?/purchaseKit" use:enhance>
                      <input type="hidden" name="kitId" value={kit.id} />
                      <button type="submit" class="purchase-btn">
                        Buy Now
                      </button>
                    </form>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>
    
    <!-- Community Courses Link -->
    <section class="shop-section">
      <div class="community-courses-link">
        <h2>Community Courses</h2>
        <p>Discover amazing courses created by the Electrofun community. Learn from fellow makers and share your knowledge.</p>
        <a href="/shop/community-courses" class="community-btn">
          Browse Community Courses
        </a>
      </div>
    </section>
  {/if}
</div>

<style>
  .shop-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .shop-page h1 {
    color: var(--primary-color);
    margin-bottom: 2rem;
    text-align: center;
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
  
  .shop-section {
    margin-bottom: 4rem;
  }
  
  .shop-section h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }
  
  .shop-section p {
    color: var(--muted);
    margin-bottom: 2rem;
  }
  
  .kits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  
  .kit-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s;
    background: var(--surface);
  }
  
  .kit-card:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
  
  .kit-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
  }
  
  .kit-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .kit-card:hover .kit-image img {
    transform: scale(1.05);
  }
  
  .kit-content {
    padding: 1.5rem;
  }
  
  .course-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s;
    position: relative;
    background: var(--surface);
  }
  
  .course-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .kit-header, .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .kit-header h3, .course-header h3 {
    margin: 0;
    color: var(--text);
    font-size: 1.2rem;
  }
  
  .level {
    background: var(--primary-color);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .theme {
    color: var(--muted);
    font-style: italic;
    margin-bottom: 1rem;
  }
  
  .creator {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .description {
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 1rem;
  }
  
  .price {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }
  
  .kit-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .purchase-options {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }
  
  .add-to-cart-btn {
    padding: 12px 24px;
    background: var(--secondary-background);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    flex: 1;
  }
  
  .add-to-cart-btn:hover {
    background: var(--border);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  
  .view-details-btn {
    padding: 0.5rem 1rem;
    background: var(--secondary-background);
    color: var(--text);
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: background 0.2s;
    border: 1px solid var(--border);
  }
  
  .view-details-btn:hover {
    background: var(--border);
  }
  
  .meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .duration {
    background: var(--secondary-background);
    padding: 2px 8px;
    border-radius: 12px;
    color: var(--muted);
  }
  
  .purchase-btn {
    padding: 12px 24px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
    flex: 1;
  }
  
  .purchase-btn:hover {
    background: var(--primary-dark);
  }
  
  .purchase-btn.small {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .owned-badge {
    background: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    text-align: center;
    font-weight: bold;
    flex: 1;
  }
  
  .access-btn {
    display: block;
    width: 100%;
    padding: 12px;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    text-align: center;
    border-radius: 8px;
    font-weight: bold;
    transition: background 0.3s;
  }
  
  .access-btn:hover {
    background: var(--primary-dark);
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
  
  .error {
    background: var(--danger);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .success {
    background: var(--primary-color);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .community-courses-link {
    text-align: center;
    padding: 3rem 2rem;
    background: var(--secondary-background);
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  
  .community-courses-link h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }
  
  .community-courses-link p {
    color: var(--muted);
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .community-btn {
    display: inline-block;
    padding: 1rem 2rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1.1rem;
    transition: background 0.2s;
  }
  
  .community-btn:hover {
    background: var(--primary-dark);
  }
</style> 