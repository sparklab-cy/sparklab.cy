<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Kit, OfficialCourse, CustomCourse } from '$lib/types/courses';
  
  const { data } = $props();
  const { kit, officialCourses, communityCourses, hasAccess } = data;
  
  let selectedImage = $state(kit.image_url || '/default-kit-image.jpg');
  let quantity = $state(1);
  
  function selectImage(imageUrl: string) {
    selectedImage = imageUrl;
  }
  
  function updateQuantity(delta: number) {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      quantity = newQuantity;
    }
  }
</script>

<div class="kit-page">
  <div class="kit-container">
    <!-- Image Gallery -->
    <div class="image-section">
      <div class="main-image">
        <img src={selectedImage} alt={kit.name} />
      </div>
      {#if kit.images && kit.images.length > 0}
        <div class="image-thumbnails">
          {#each kit.images as image}
            <img 
              src={image} 
              alt={kit.name}
              class:selected={selectedImage === image}
              on:click={() => selectImage(image)}
            />
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- Product Info -->
    <div class="product-info">
      <div class="product-header">
        <h1>{kit.name}</h1>
        <div class="badges">
          <span class="level-badge">Level {kit.level}</span>
          <span class="theme-badge">{kit.theme}</span>
        </div>
      </div>
      
      <div class="price-section">
        <div class="price">${kit.price}</div>
        {#if kit.premium_upgrade_price}
          <div class="premium-price">Premium Upgrade: ${kit.premium_upgrade_price}</div>
        {/if}
      </div>
      
      <div class="description">
        <h3>Description</h3>
        <p>{kit.description}</p>
      </div>
      
      {#if kit.features && kit.features.length > 0}
        <div class="features">
          <h3>Features</h3>
          <ul>
            {#each kit.features as feature}
              <li>{feature}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if kit.specifications}
        <div class="specifications">
          <h3>Specifications</h3>
          <div class="spec-grid">
            {#each Object.entries(kit.specifications) as [key, value]}
              <div class="spec-item">
                <span class="spec-label">{key}:</span>
                <span class="spec-value">{value}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Purchase Section -->
      <div class="purchase-section">
        {#if hasAccess}
          <div class="owned-message">
            <h3>You own this kit!</h3>
            <p>Access your courses and start building.</p>
            <a href="/courses/official/{kit.id}" class="access-btn">View Courses</a>
          </div>
        {:else}
          <div class="quantity-selector">
            <label for="quantity">Quantity:</label>
            <div class="quantity-controls">
              <button type="button" on:click={() => updateQuantity(-1)}>-</button>
              <input 
                type="number" 
                id="quantity" 
                bind:value={quantity} 
                min="1" 
                max="10"
              />
              <button type="button" on:click={() => updateQuantity(1)}>+</button>
            </div>
          </div>
          
          <form method="POST" action="?/purchaseKit" use:enhance>
            <input type="hidden" name="kitId" value={kit.id} />
            <input type="hidden" name="quantity" value={quantity} />
            <button type="submit" class="purchase-btn">
              Add to Cart - ${(kit.price * quantity).toFixed(2)}
            </button>
          </form>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Courses Section -->
  <div class="courses-section">
    <h2>Available Courses</h2>
    
    {#if officialCourses.length > 0}
      <div class="courses-subsection">
        <h3>Official Courses</h3>
        <div class="courses-grid">
          {#each officialCourses as course}
            <div class="course-card">
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              {#if course.estimated_duration}
                <span class="duration">{course.estimated_duration} min</span>
              {/if}
              {#if hasAccess}
                <a href="/courses/official/{kit.id}/lessons/{course.id}" class="course-btn">Start Course</a>
              {:else}
                <span class="requires-kit">Requires kit purchase</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if communityCourses.length > 0}
      <div class="courses-subsection">
        <h3>Community Courses</h3>
        <div class="courses-grid">
          {#each communityCourses as course}
            <div class="course-card">
              <h4>{course.title}</h4>
              <p>{course.description}</p>
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
              {#if hasAccess}
                <a href="/courses/community/{course.id}" class="course-btn">Access Course</a>
              {:else}
                <span class="requires-kit">Requires kit purchase</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .kit-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .kit-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-bottom: 4rem;
  }
  
  .image-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .main-image {
    border-radius: 12px;
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border);
  }
  
  .main-image img {
    width: 100%;
    height: 400px;
    object-fit: cover;
  }
  
  .image-thumbnails {
    display: flex;
    gap: 0.5rem;
  }
  
  .image-thumbnails img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }
  
  .image-thumbnails img:hover {
    border-color: var(--primary-color);
  }
  
  .image-thumbnails img.selected {
    border-color: var(--primary-color);
  }
  
  .product-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .product-header h1 {
    color: var(--text);
    margin: 0 0 1rem 0;
    font-size: 2rem;
  }
  
  .badges {
    display: flex;
    gap: 0.5rem;
  }
  
  .level-badge, .theme-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .level-badge {
    background: var(--primary-color);
    color: white;
  }
  
  .theme-badge {
    background: var(--accent);
    color: var(--text);
  }
  
  .price-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .price {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  .premium-price {
    font-size: 1rem;
    color: var(--muted);
  }
  
  .description h3, .features h3, .specifications h3 {
    color: var(--text);
    margin: 0 0 0.5rem 0;
  }
  
  .description p {
    color: var(--muted);
    line-height: 1.6;
  }
  
  .features ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .features li {
    color: var(--muted);
    padding: 0.25rem 0;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .features li::before {
    content: "-";
    position: absolute;
    left: 0;
    color: var(--primary-color);
    font-weight: bold;
  }
  
  .spec-grid {
    display: grid;
    gap: 0.5rem;
  }
  
  .spec-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
  }
  
  .spec-label {
    font-weight: 500;
    color: var(--text);
  }
  
  .spec-value {
    color: var(--muted);
  }
  
  .purchase-section {
    border-top: 1px solid var(--border);
    padding-top: 1.5rem;
  }
  
  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .quantity-controls button {
    padding: 0.5rem 1rem;
    border: none;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .quantity-controls button:hover {
    background: var(--secondary-background);
  }
  
  .quantity-controls input {
    width: 60px;
    text-align: center;
    border: none;
    padding: 0.5rem;
    background: var(--surface);
    color: var(--text);
  }
  
  .purchase-btn {
    width: 100%;
    padding: 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .purchase-btn:hover {
    background: var(--primary-dark);
  }
  
  .owned-message {
    text-align: center;
    padding: 2rem;
    background: var(--secondary-background);
    border-radius: 8px;
  }
  
  .owned-message h3 {
    color: var(--primary-color);
    margin: 0 0 0.5rem 0;
  }
  
  .owned-message p {
    color: var(--muted);
    margin: 0 0 1rem 0;
  }
  
  .access-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .access-btn:hover {
    background: var(--primary-dark);
  }
  
  .courses-section {
    border-top: 1px solid var(--border);
    padding-top: 2rem;
  }
  
  .courses-section h2 {
    color: var(--text);
    margin: 0 0 2rem 0;
  }
  
  .courses-subsection {
    margin-bottom: 3rem;
  }
  
  .courses-subsection h3 {
    color: var(--text);
    margin: 0 0 1rem 0;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .course-card {
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  
  .course-card h4 {
    color: var(--text);
    margin: 0 0 0.5rem 0;
  }
  
  .course-card p {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
  }
  
  .course-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .duration {
    background: var(--secondary-background);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: var(--muted);
  }
  
  .price {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .course-btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.875rem;
    transition: background 0.2s;
  }
  
  .course-btn:hover {
    background: var(--primary-dark);
  }
  
  .requires-kit {
    color: var(--muted);
    font-size: 0.875rem;
    font-style: italic;
  }
  
  @media (max-width: 768px) {
    .kit-container {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .main-image img {
      height: 300px;
    }
    
    .product-header h1 {
      font-size: 1.5rem;
    }
    
    .price {
      font-size: 1.5rem;
    }
  }
</style> 