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
  <h1>ByteBlocks Shop</h1>
  
  {#if form?.message}
	<div class="message success">{form.message}</div>
  {/if}
  
  {#if form?.error}
	<div class="message error">{form.error}</div>
  {/if}
  
  {#if error}
	<div class="message error">{error}</div>
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
				  <div class="owned-badge">Owned</div>
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
		<p>Discover amazing courses created by the ByteBlocks community. Learn from fellow makers and share your knowledge.</p>
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
	background: var(--color-background);
  }
  
  .shop-page h1 {
	margin-bottom: 2rem;
	text-align: center;
	color: var(--color-text);
	font-size: var(--font-size-h1);
  }
  
  .search-filters {
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 2rem;
	background: var(--secondary-background);
  }
  
  .search-bar {
	margin-bottom: 1rem;
  }
  
  .search-bar input {
	width: 100%;
	padding: 0.75rem 1rem;
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	font-size: var(--font-size);
	background: var(--color-background);
	color: var(--color-text);
	transition: border-color 0.2s ease;
  }
  
  .search-bar input:focus {
	outline: none;
	border-color: var(--color-primary);
  }
  
  .filters {
	display: flex;
	gap: 1rem;
	margin-bottom: 1rem;
	flex-wrap: wrap;
  }
  
  .filters select {
	padding: 0.5rem 0.75rem;
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	font-size: var(--font-size);
	background: var(--color-background);
	color: var(--color-text);
	cursor: pointer;
	transition: border-color 0.2s ease;
  }
  
  .filters select:focus {
	outline: none;
	border-color: var(--color-primary);
  }
  
  .clear-filters {
	padding: 0.5rem 1rem;
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	cursor: pointer;
	font-size: var(--font-size);
	background: var(--secondary-background);
	color: var(--color-text);
	transition: all 0.2s ease;
  }
  
  .clear-filters:hover {
	background: var(--secondary-background);
	color: var(--color-text);
	border-color: var(--color-primary);
  }
  
  .results-count {
	font-size: var(--font-size);
	color: var(--color-text);
  }
  
  .shop-section {
	margin-bottom: 4rem;
  }
  
  .shop-section h2 {
	margin-bottom: 1rem;
	color: var(--color-text);
	font-size: var(--font-size-h2);
  }
  
  .shop-section p {
	margin-bottom: 2rem;
	color: var(--color-text);
	font-size: var(--font-size);
  }
  
  .kits-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 2rem;
  }
  
  .kit-card {
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	overflow: hidden;
	background: var(--secondary-background);
	transition: all 0.3s ease;
  }
  
  .kit-card:hover {
	border-color: var(--border);
	box-shadow: 0 6px 16px rgba(94, 96, 206, 0.15);
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
  }
  
  .kit-content {
	padding: 1.5rem;
  }
  
  .kit-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 1rem;
  }
  
  .kit-header h3 {
	margin: 0;
	font-size: var(--font-size-h3);
	color: var(--color-text);
  }
  
  .level {
	border: var(--border-width) solid var(--border);
	padding: 4px 8px;
	border-radius: 6px;
	font-size: var(--font-size);
	font-weight: bold;
	color: var(--color-text);
	background: var(--secondary-background);
  }
  
  .theme {
	font-style: italic;
	margin-bottom: 1rem;
	color: var(--color-secondary);
  }
  
  .description {
	line-height: 1.5;
	margin-bottom: 1rem;
	color: var(--color-text);
  }
  
  .price {
	font-size: var(--font-size-h3);
	font-weight: bold;
	margin-bottom: 1rem;
	color: var(--color-text);
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
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	font-size: var(--font-size);
	font-weight: 500;
	cursor: pointer;
	flex: 1;
	background: var(--secondary-background);
	color: var(--color-text);
	transition: all 0.2s ease;
  }
  
  .add-to-cart-btn:hover {
	background: var(--secondary-background);
	color: var(--color-text);
	border-color: var(--color-primary);
  }
  
  .view-details-btn {
	padding: 0.5rem 1rem;
	text-decoration: none;
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	font-size: var(--font-size);
	display: inline-block;
	color: var(--color-text);
	background: var(--secondary-background);
	transition: all 0.2s ease;
  }
  
  .view-details-btn:hover {
	background: var(--secondary-background);
	color: var(--color-text);
	border-color: var(--color-primary);
  }
  
  .purchase-btn {
	padding: 12px 24px;
	border: var(--border-width) solid var(--color-primary);
	border-radius: 8px;
	font-size: var(--font-size);
	font-weight: bold;
	cursor: pointer;
	flex: 1;
	background: var(--color-primary);
	color: var(--color-background);
	transition: all 0.2s ease;
  }
  
  .purchase-btn:hover {
	background: var(--color-accent);
	border-color: var(--color-accent);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(94, 96, 206, 0.3);
  }
  
  .owned-badge {
	border: var(--border-width) solid var(--border);
	padding: 8px 16px;
	border-radius: 8px;
	text-align: center;
	font-weight: bold;
	flex: 1;
	background: var(--secondary-background);
	color: var(--color-text);
	font-size: var(--font-size);
  }
  
  .community-courses-link {
	text-align: center;
	padding: 3rem 2rem;
	border: var(--border-width) solid var(--border);
	border-radius: 8px;
	background: var(--secondary-background);
  }
  
  .community-courses-link h2 {
	margin-bottom: 1rem;
	color: var(--color-text);
	font-size: var(--font-size-h2);
  }
  
  .community-courses-link p {
	margin-bottom: 2rem;
	max-width: 600px;
	margin-left: auto;
	margin-right: auto;
	color: var(--color-text);
  }
  
  .community-btn {
	display: inline-block;
	padding: 1rem 2rem;
	border: var(--border-width) solid var(--color-primary);
	text-decoration: none;
	border-radius: 8px;
	font-weight: bold;
	font-size: var(--font-size);
	background: var(--color-primary);
	color: var(--color-background);
	transition: all 0.3s ease;
  }
  
  .community-btn:hover {
	background: var(--color-accent);
	border-color: var(--color-accent);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(94, 96, 206, 0.3);
  }
  
  .message {
	padding: 1rem;
	border-radius: 8px;
	text-align: center;
	margin-bottom: 2rem;
	border: var(--border-width) solid var(--border);
	background: var(--color-background);
	font-size: var(--font-size);
  }
  
  .message.error {
	border-color: #dc3545;
	background: rgba(220, 53, 69, 0.1);
	color: #dc3545;
  }
  
  .message.success {
	border-color: var(--color-tertiary);
	background: rgba(72, 191, 227, 0.1);
	color: var(--color-tertiary);
  }
</style>
