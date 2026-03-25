<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';

  const { data, form } = $props();
  const { user, profile, userKits, userProgress, recentOrders, error } = data;

  const successMessage = $derived(page.url.searchParams.get('message'));

  const totalLessons = userProgress.length;
  const completedLessons = userProgress.filter((p: any) => p.status === 'completed').length;
  const inProgressLessons = userProgress.filter((p: any) => p.status === 'in_progress').length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  let fullName = $state(profile?.full_name || user?.user_metadata?.full_name || '');
  let bio = $state(profile?.bio || '');
</script>

<div class="profile-page">
  {#if successMessage === 'order-success'}
    <div class="banner banner-success">
      <strong>Order successful!</strong> Your kits are now available in your courses.
    </div>
  {/if}

  {#if form?.success}
    <div class="banner banner-success">Profile updated.</div>
  {/if}
  {#if form?.error}
    <div class="banner banner-error">{form.error}</div>
  {/if}

  {#if error}
    <div class="banner banner-error">{error}</div>
  {:else}
    <header class="profile-header animate-in">
      <div class="avatar-area">
        {#if user?.user_metadata?.avatar_url}
          <img src={user.user_metadata.avatar_url} alt="Profile" class="avatar-img" />
        {:else}
          <div class="avatar-placeholder">
            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
        {/if}
      </div>
      <div class="header-text">
        <h1>{user?.user_metadata?.full_name || user?.email}</h1>
        <p class="role-label">{profile?.role === 'admin' ? 'Administrator' : profile?.role === 'teacher' ? 'Teacher' : 'Student'}</p>
      </div>
      <div class="header-actions">
        <a href="/courses" class="btn-primary">My Courses</a>
        <a href="/shop" class="btn-secondary">Shop</a>
      </div>
    </header>

    <section class="stats-row animate-in delay-1">
      <div class="stat-card">
        <span class="stat-num">{totalLessons}</span>
        <span class="stat-label">Lessons</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{completedLessons}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{inProgressLessons}</span>
        <span class="stat-label">In Progress</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{completionRate}%</span>
        <span class="stat-label">Completion</span>
      </div>
    </section>

    <div class="grid-two">
      <section class="card animate-in delay-2">
        <h2>My Kits</h2>
        {#if userKits.length === 0}
          <div class="empty">
            <p>No kits yet.</p>
            <a href="/shop" class="btn-primary btn-sm">Browse Kits</a>
          </div>
        {:else}
          <div class="kit-list">
            {#each userKits as kit}
              <div class="kit-row">
                <img src={kit.image_url || '/default-kit-image.jpg'} alt={kit.name} class="kit-thumb" />
                <div>
                  <strong>{kit.name}</strong>
                  <span class="kit-meta">Level {kit.level} &middot; {kit.theme}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section class="card animate-in delay-3">
        <h2>Recent Orders</h2>
        {#if recentOrders.length === 0}
          <div class="empty">
            <p>No orders yet.</p>
            <a href="/shop" class="btn-primary btn-sm">Start Shopping</a>
          </div>
        {:else}
          <div class="order-list">
            {#each recentOrders as order}
              <div class="order-row">
                <div>
                  <strong>Order #{order.id.slice(0, 8)}</strong>
                  <span class="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <span class="order-badge {order.status}">{order.status}</span>
                <span class="order-amount">${order.total_amount}</span>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>

    <section class="card settings-card animate-in delay-4">
      <h2>Profile Settings</h2>
      <form method="POST" action="?/updateProfile" use:enhance class="settings-form">
        <div class="field">
          <label for="fullName">Full Name</label>
          <input id="fullName" name="fullName" type="text" bind:value={fullName} placeholder="Your name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" value={user?.email || ''} disabled />
          <small>Email cannot be changed.</small>
        </div>
        <div class="field">
          <label for="bio">Bio</label>
          <textarea id="bio" name="bio" rows="3" bind:value={bio} placeholder="Tell us about yourself"></textarea>
        </div>
        <button type="submit" class="btn-primary btn-save">Save Changes</button>
      </form>
    </section>
  {/if}
</div>

<style>
  .profile-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 2rem 4rem;
  }

  .banner {
    text-align: center;
    padding: 0.85rem 1rem;
    border-radius: var(--radius);
    margin-bottom: 1.5rem;
    font-size: 0.92rem;
    font-weight: 700;
  }

  .banner-success {
    background: rgba(72, 191, 227, 0.12);
    border: 1px solid color-mix(in srgb, var(--color-tertiary) 55%, var(--border));
    color: var(--color-tertiary);
  }

  .banner-error {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    margin-bottom: 1.25rem;
  }

  .avatar-area {
    width: 72px;
    height: 72px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid color-mix(in srgb, var(--color-primary) 50%, var(--border));
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: var(--color-primary);
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 1.6rem;
    font-weight: 900;
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .header-text h1 {
    margin: 0;
    font-size: 1.35rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .role-label {
    margin: 0.2rem 0 0;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    gap: 0.55rem;
    flex-shrink: 0;
  }

  .btn-primary,
  .btn-secondary {
    display: inline-block;
    padding: 0.55rem 1.15rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 800;
    font-size: 0.9rem;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #fff;
  }

  .btn-secondary {
    background: var(--color-background);
    border: 1px solid var(--border);
    color: var(--color-text);
  }

  .btn-primary:hover,
  .btn-secondary:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  .btn-sm {
    padding: 0.45rem 0.95rem;
    font-size: 0.85rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    padding: 1rem;
    text-align: center;
  }

  .stat-num {
    display: block;
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1.1;
  }

  .stat-label {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.82rem;
    color: var(--muted);
    font-weight: 700;
  }

  .grid-two {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    padding: 1.25rem;
  }

  .card h2 {
    margin: 0 0 1rem;
    font-size: var(--font-size-h3);
    color: var(--color-text);
  }

  .empty {
    text-align: center;
    padding: 1.5rem 0;
    color: var(--muted);
  }

  .empty p {
    margin: 0 0 0.8rem;
  }

  .kit-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .kit-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .kit-thumb {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid var(--border);
    flex-shrink: 0;
  }

  .kit-row strong {
    display: block;
    color: var(--color-text);
    font-size: 0.92rem;
  }

  .kit-meta {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .order-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .order-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .order-row > div {
    flex: 1;
    min-width: 0;
  }

  .order-row strong {
    display: block;
    color: var(--color-text);
    font-size: 0.92rem;
  }

  .order-date {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .order-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: capitalize;
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    color: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 35%, var(--border));
  }

  .order-badge.completed {
    background: rgba(72, 191, 227, 0.12);
    color: var(--color-tertiary);
    border-color: color-mix(in srgb, var(--color-tertiary) 35%, var(--border));
  }

  .order-amount {
    font-weight: 800;
    color: var(--color-text);
    font-size: 0.92rem;
    flex-shrink: 0;
  }

  .settings-card {
    max-width: 620px;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field label {
    font-weight: 800;
    font-size: 0.85rem;
    color: var(--color-text);
  }

  .field input,
  .field textarea {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 0.95rem;
  }

  .field input:focus,
  .field textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .field input:disabled {
    background: var(--secondary-background);
    color: var(--muted);
    cursor: not-allowed;
  }

  .field small {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .btn-save {
    align-self: flex-start;
  }

  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }

    .header-text h1 {
      white-space: normal;
    }

    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid-two {
      grid-template-columns: 1fr;
    }
  }
</style>
