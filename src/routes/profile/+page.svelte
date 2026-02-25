<script lang="ts">
  import { page } from '$app/state';
  import type { UserProgress, Kit, CustomCourse, OfficialCourse } from '$lib/types/courses';
  
  const { data } = $props();
  const { user, profile, userProgress, userKits, recentOrders, analytics, error } = data;
  
  const currentPath = $derived(page.url.pathname);
  const urlParams = $derived(page.url.searchParams);
  const successMessage = $derived(urlParams.get('message'));
  
  // Calculate analytics
  const totalCourses = userProgress.length;
  const completedCourses = userProgress.filter(p => p.status === 'completed').length;
  const inProgressCourses = userProgress.filter(p => p.status === 'in_progress').length;
  const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  
  // Get recent activity
  const recentActivity = userProgress
    .filter(p => p.completed_at)
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 5);
</script>

<div class="dashboard-page">
  {#if successMessage === 'order-success'}
    <div class="success-message">
      <h3>Order Successful!</h3>
      <p>Thank you for your purchase. Your kits are now available in your courses.</p>
    </div>
  {/if}
  
  {#if error}
    <div class="error">{error}</div>
  {:else}
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="user-info">
        <div class="user-avatar">
          {#if user?.user_metadata?.avatar_url}
            <img src={user.user_metadata.avatar_url} alt="Profile" />
          {:else}
            <div class="avatar-placeholder">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          {/if}
        </div>
        <div class="user-details">
          <h1>Welcome back, {user?.user_metadata?.full_name || user?.email}!</h1>
          <p class="user-role">{profile?.role === 'admin' ? 'Administrator' : 'Student'}</p>
        </div>
      </div>
      
      <div class="quick-actions">
        <a href="/courses" class="action-btn">Continue Learning</a>
        <a href="/shop" class="action-btn secondary">Browse Shop</a>
      </div>
    </div>
    
    <!-- Analytics Overview -->
    <div class="analytics-grid">
      <div class="stat-card">
        <div class="stat-content">
          <h3>{totalCourses}</h3>
          <p>Total Courses</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <h3>{completedCourses}</h3>
          <p>Completed</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <h3>{inProgressCourses}</h3>
          <p>In Progress</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-content">
          <h3>{completionRate}%</h3>
          <p>Completion Rate</p>
        </div>
      </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="dashboard-content">
      <!-- Progress Overview -->
      <div class="content-section">
        <h2>Learning Progress</h2>
        {#if userProgress.length === 0}
          <div class="empty-state">
            <p>You haven't started any courses yet.</p>
            <a href="/courses" class="cta-btn">Start Learning</a>
          </div>
        {:else}
          <div class="progress-list">
            {#each userProgress.slice(0, 5) as progress}
              <div class="progress-item">
                <div class="progress-info">
                  <h4>{progress.course_title || 'Unknown Course'}</h4>
                  <p class="progress-status">
                    {#if progress.status === 'completed'}
                      <span class="status completed">Completed</span>
                    {:else if progress.status === 'in_progress'}
                      <span class="status in-progress">In Progress</span>
                    {:else}
                      <span class="status not-started">Not Started</span>
                    {/if}
                  </p>
                </div>
                {#if progress.completed_at}
                  <div class="progress-date">
                    {new Date(progress.completed_at).toLocaleDateString()}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          <a href="/courses" class="view-all-btn">View All Courses</a>
        {/if}
      </div>
      
      <!-- My Kits -->
      <div class="content-section">
        <h2>My Kits</h2>
        {#if userKits.length === 0}
          <div class="empty-state">
            <p>You don't have any kits yet.</p>
            <a href="/shop" class="cta-btn">Browse Kits</a>
          </div>
        {:else}
          <div class="kits-grid">
            {#each userKits as kit}
              <div class="kit-card">
                <div class="kit-image">
                  <img src={kit.image_url || '/default-kit-image.jpg'} alt={kit.name} />
                </div>
                <div class="kit-info">
                  <h4>{kit.name}</h4>
                  <p class="kit-level">Level {kit.level}</p>
                  <p class="kit-theme">{kit.theme}</p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Recent Orders -->
      <div class="content-section">
        <h2>Recent Orders</h2>
        {#if recentOrders.length === 0}
          <div class="empty-state">
            <p>No orders yet.</p>
            <a href="/shop" class="cta-btn">Start Shopping</a>
          </div>
        {:else}
          <div class="orders-list">
            {#each recentOrders as order}
              <div class="order-item">
                <div class="order-info">
                  <h4>Order #{order.id}</h4>
                  <p class="order-date">{new Date(order.created_at).toLocaleDateString()}</p>
                  <p class="order-status">
                    <span class="status {order.status}">{order.status}</span>
                  </p>
                </div>
                <div class="order-total">
                  ${order.total_amount}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Profile Settings -->
      <div class="content-section">
        <h2>Profile Settings</h2>
        <div class="profile-form">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              value={user?.user_metadata?.full_name || ''} 
              placeholder="Enter your full name"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={user?.email || ''} 
              disabled
            />
            <small>Email cannot be changed</small>
          </div>
          
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio" 
              placeholder="Tell us about yourself..."
              rows="3"
            ></textarea>
          </div>
          
          <button class="save-btn">Save Changes</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .success-message {
    background: var(--primary-color);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .success-message h3 {
    margin: 0 0 0.5rem 0;
  }
  
  .success-message p {
    margin: 0;
    opacity: 0.9;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 2rem;
    background: var(--surface);
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--primary-color);
  }
  
  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
  }
  
  .user-details h1 {
    margin: 0 0 0.5rem 0;
    color: var(--text);
  }
  
  .user-role {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .quick-actions {
    display: flex;
    gap: 1rem;
  }
  
  .action-btn {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .action-btn:hover {
    background: var(--primary-dark);
  }
  
  .action-btn.secondary {
    background: var(--secondary-background);
    color: var(--text);
    border: 1px solid var(--border);
  }
  
  .action-btn.secondary:hover {
    background: var(--border);
  }
  
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .stat-icon {
    font-size: 2rem;
  }
  
  .stat-content h3 {
    margin: 0 0 0.25rem 0;
    font-size: 2rem;
    color: var(--primary-color);
  }
  
  .stat-content p {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .dashboard-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }
  
  .content-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .content-section h2 {
    margin: 0 0 1.5rem 0;
    color: var(--text);
    font-size: 1.5rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--muted);
  }
  
  .empty-state p {
    margin-bottom: 1rem;
  }
  
  .cta-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .progress-list, .orders-list {
    margin-bottom: 1rem;
  }
  
  .progress-item, .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
  }
  
  .progress-item:last-child, .order-item:last-child {
    border-bottom: none;
  }
  
  .progress-info h4, .order-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--text);
  }
  
  .progress-date, .order-date {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .status.completed {
    background: var(--primary-color);
    color: white;
  }
  
  .status.in-progress {
    background: var(--warning);
    color: white;
  }
  
  .status.not-started {
    background: var(--secondary-background);
    color: var(--muted);
  }
  
  .order-total {
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .view-all-btn {
    display: block;
    text-align: center;
    padding: 0.75rem;
    background: var(--secondary-background);
    color: var(--text);
    text-decoration: none;
    border-radius: 8px;
    border: 1px solid var(--border);
    transition: background 0.2s;
  }
  
  .view-all-btn:hover {
    background: var(--border);
  }
  
  .kits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .kit-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
  }
  
  .kit-card:hover {
    transform: translateY(-2px);
  }
  
  .kit-image {
    width: 100%;
    height: 100px;
    overflow: hidden;
  }
  
  .kit-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .kit-info {
    padding: 1rem;
  }
  
  .kit-info h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text);
  }
  
  .kit-level, .kit-theme {
    margin: 0 0 0.25rem 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    font-weight: 500;
    color: var(--text);
  }
  
  .form-group input, .form-group textarea {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    font-size: 1rem;
  }
  
  .form-group input:focus, .form-group textarea:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  .form-group input:disabled {
    background: var(--secondary-background);
    color: var(--muted);
  }
  
  .form-group small {
    color: var(--muted);
    font-size: 0.8rem;
  }
  
  .save-btn {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-start;
  }
  
  .save-btn:hover {
    background: var(--primary-dark);
  }
  
  .error {
    background: var(--danger);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .quick-actions {
      width: 100%;
      justify-content: center;
    }
    
    .analytics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .dashboard-content {
      grid-template-columns: 1fr;
    }
  }
</style> 