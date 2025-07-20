<script lang="ts">
  import { page } from '$app/state';
  import ThemeToggle from './ThemeToggle.svelte';
  import CartIcon from './CartIcon.svelte';
  
  const { user } = $props();
  
  const currentPath = $derived(page.url.pathname);
</script>

<nav class="navigation">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="/" class="brand-link">
        <span class="brand-text">Electrofun</span>
      </a>
    </div>
    
    <div class="nav-links">
      <a href="/" class="nav-link" class:active={currentPath === '/'}>
        Home
      </a>
      <a href="/shop" class="nav-link" class:active={currentPath === '/shop' || currentPath.startsWith('/shop/')}>
        Shop
      </a>
      <a href="/redeem" class="nav-link" class:active={currentPath === '/redeem'}>
        Redeem Code
      </a>
      <a href="/courses" class="nav-link" class:active={currentPath.startsWith('/courses')}>
        Courses
      </a>
      <a href="/create-course" class="nav-link" class:active={currentPath === '/create-course'}>
        Create Course
      </a>
      {#if user?.role === 'admin'}
        <a href="/admin" class="nav-link" class:active={currentPath.startsWith('/admin')}>
          Admin
        </a>
      {/if}
      <CartIcon />
      <ThemeToggle />
    </div>
  </div>
</nav>

<style>
  .navigation {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
  }
  
  .nav-brand {
    display: flex;
    align-items: center;
  }
  
  .brand-link {
    text-decoration: none;
    color: var(--primary-color);
    font-weight: bold;
    font-size: 1.5rem;
    transition: color 0.2s ease-in-out;
  }
  
  .brand-text {
    color: var(--primary-color);
  }
  
  .nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;
  }
  
  .nav-link {
    text-decoration: none;
    color: var(--muted);
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.3s;
  }
  
  .nav-link:hover {
    color: var(--primary-color);
  }
  
  .nav-link.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
  }
  
  @media (max-width: 768px) {
    .nav-container {
      padding: 0 1rem;
    }
    
    .nav-links {
      gap: 1rem;
    }
    
    .brand-text {
      font-size: 1.2rem;
    }
  }
</style> 