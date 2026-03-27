<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { Kit, KitCode, Purchase } from '$lib/types/courses';
  
  const { data, form } = $props();
  const { kits, kitCodes, purchases, error } = data;
  
  let showCreateKit = $state(false);
  let showGenerateCodes = $state(false);
  let showGrantAccess = $state(false);
  let selectedKit: Kit | null = $state(null);
  
  function openCreateKit() {
    showCreateKit = true;
  }
  
  function openGenerateCodes(kit: Kit) {
    selectedKit = kit;
    showGenerateCodes = true;
  }
  
  function openGrantAccess() {
    showGrantAccess = true;
  }
  
  function getCodeStatus(code: KitCode): string {
    if (code.is_used) return 'Used';
    if (code.expires_at && new Date(code.expires_at) < new Date()) return 'Expired';
    return 'Available';
  }
  
  function getCodeStatusClass(code: KitCode): string {
    if (code.is_used) return 'used';
    if (code.expires_at && new Date(code.expires_at) < new Date()) return 'expired';
    return 'available';
  }
  
  function getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'stripe': return 'Credit Card';
      case 'code_redemption': return 'Code Redemption';
      case 'admin_grant': return 'Admin Grant';
      default: return method;
    }
  }
</script>

<div class="admin-kits-page">
  <header class="page-header">
    <h1>Kit Management</h1>
    <p>Manage kits, generate codes, and track purchases</p>
  </header>

  {#if form?.message}
    <div class="success">{form.message}</div>
  {/if}
  
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  {#if error}
    <div class="error">{error}</div>
  {:else}
    <div class="admin-content">
      <!-- Kit Management Section -->
      <section class="section">
        <div class="section-header">
          <h2>Kits</h2>
          <div class="section-header-actions">
            <form
              method="POST"
              action="?/syncShopifyKits"
              use:enhance={() => {
                return async ({ result, update }) => {
                  await update({ reset: false });
                  if (result.type === 'success') {
                    await invalidateAll();
                  }
                };
              }}
            >
              <button type="submit" class="btn-sync">Sync from Shopify</button>
            </form>
            <button class="btn-primary" on:click={openCreateKit}>+ Create New Kit</button>
          </div>
        </div>
        <p class="section-hint">
          Pull product titles, prices, and images from your Shopify catalog into <code>kits</code>
          (matched by handle). Requires Shopify env vars and <code>PRIVATE_SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
        
        <div class="kits-grid">
          {#each kits as kit}
            <div class="kit-card">
              <div class="kit-header">
                <h3>{kit.name}</h3>
                <span class="level">Level {kit.level}</span>
              </div>
              <p class="theme">{kit.theme}</p>
              <p class="description">{kit.description}</p>
              <div class="kit-meta">
                <span class="price">${kit.price}</span>
                <span class="type">{kit.kit_type}</span>
              </div>
              <div class="kit-actions">
                <button class="btn-secondary" on:click={() => openGenerateCodes(kit)}>
                  Generate Codes
                </button>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- Kit Codes Section -->
      <section class="section">
        <div class="section-header">
          <h2>Kit Codes</h2>
          <button class="btn-secondary" on:click={openGrantAccess}>Grant Access</button>
        </div>
        
        <div class="codes-table">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Kit</th>
                <th>Type</th>
                <th>Status</th>
                <th>Used By</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each kitCodes as code}
                <tr>
                  <td class="code-cell">
                    <code>{code.code}</code>
                  </td>
                  <td>{code.kit?.name}</td>
                  <td>{code.code_type}</td>
                  <td>
                    <span class="status {getCodeStatusClass(code)}">
                      {getCodeStatus(code)}
                    </span>
                  </td>
                  <td>{code.used_by || '-'}</td>
                  <td>{new Date(code.created_at).toLocaleDateString()}</td>
                  <td>
                    {#if !code.is_used}
                      <form method="POST" action="?/deleteKitCode" use:enhance style="display: inline;">
                        <input type="hidden" name="codeId" value={code.id} />
                        <button type="submit" class="btn-danger small">Delete</button>
                      </form>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Purchase History Section -->
      <section class="section">
        <h2>Purchase History</h2>
        
        <div class="purchases-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Kit</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each purchases as purchase}
                <tr>
                  <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                  <td>{purchase.user_id}</td>
                  <td>{purchase.kit?.name}</td>
                  <td>${purchase.amount}</td>
                  <td>{getPaymentMethodLabel(purchase.payment_method)}</td>
                  <td>
                    <span class="status {purchase.payment_status}">
                      {purchase.payment_status}
                    </span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  {/if}
</div>

<!-- Create Kit Modal -->
{#if showCreateKit}
  <div class="modal-overlay" on:click={() => showCreateKit = false}>
    <div class="modal" on:click|stopPropagation>
      <h2>Create New Kit</h2>
      <form method="POST" action="?/createKit" use:enhance>
        <div class="form-group">
          <label for="name">Kit Name</label>
          <input type="text" id="name" name="name" required />
        </div>
        
        <div class="form-group">
          <label for="theme">Theme</label>
          <input type="text" id="theme" name="theme" required />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="level">Level</label>
            <select id="level" name="level" required>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="price">Price</label>
            <input type="number" id="price" name="price" step="0.01" required />
          </div>
        </div>
        
        <div class="form-group">
          <label for="kit_type">Kit Type</label>
          <select id="kit_type" name="kit_type" required>
            <option value="normal">Normal</option>
            <option value="organization">Organization</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" name="description" rows="3" required></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={() => showCreateKit = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">Create Kit</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Generate Codes Modal -->
{#if showGenerateCodes && selectedKit}
  <div class="modal-overlay" on:click={() => showGenerateCodes = false}>
    <div class="modal" on:click|stopPropagation>
      <h2>Generate Codes for {selectedKit.name}</h2>
      <form method="POST" action="?/generateKitCodes" use:enhance>
        <input type="hidden" name="kitId" value={selectedKit.id} />
        
        <div class="form-group">
          <label for="codeType">Code Type</label>
          <select id="codeType" name="codeType" required>
            <option value="qr">QR Code</option>
            <option value="access_code">Access Code</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="quantity">Quantity</label>
          <input type="number" id="quantity" name="quantity" min="1" max="100" value="10" required />
        </div>
        
        <div class="form-group">
          <label for="expiresAt">Expires At (Optional)</label>
          <input type="datetime-local" id="expiresAt" name="expiresAt" />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={() => showGenerateCodes = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">Generate Codes</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Grant Access Modal -->
{#if showGrantAccess}
  <div class="modal-overlay" on:click={() => showGrantAccess = false}>
    <div class="modal" on:click|stopPropagation>
      <h2>Grant Kit Access</h2>
      <form method="POST" action="?/grantKitAccess" use:enhance>
        <div class="form-group">
          <label for="userId">User ID</label>
          <input type="text" id="userId" name="userId" required />
        </div>
        
        <div class="form-group">
          <label for="grantKitId">Kit</label>
          <select id="grantKitId" name="kitId" required>
            {#each kits as kit}
              <option value={kit.id}>{kit.name} (Level {kit.level})</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="grantExpiresAt">Expires At (Optional)</label>
          <input type="datetime-local" id="grantExpiresAt" name="expiresAt" />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={() => showGrantAccess = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">Grant Access</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .admin-kits-page {
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

  .section-header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  .section-header-actions form {
    margin: 0;
  }

  .btn-sync {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid #1976d2;
    background: #fff;
    color: #1976d2;
  }

  .btn-sync:hover {
    background: #e3f2fd;
  }

  .section-hint {
    margin: -0.75rem 0 1.25rem;
    font-size: 0.875rem;
    color: #666;
    line-height: 1.45;
  }

  .section-hint code {
    font-size: 0.8125rem;
    background: #f5f5f5;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }
  
  .kits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .kit-card {
    border: 1px solid #eee;
    border-radius: 8px;
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
    color: #333;
  }
  
  .level {
    background: #012d58;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }
  
  .theme {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
  }
  
  .description {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .kit-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .price {
    font-weight: bold;
    color: #012d58;
  }
  
  .type {
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }
  
  .btn-primary, .btn-secondary, .btn-danger {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
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
  
  .btn-danger {
    background: #dc3545;
    color: white;
  }
  
  .btn-danger:hover {
    background: #c82333;
  }
  
  .btn-danger.small {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
  
  .codes-table, .purchases-table {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background: #f9f9f9;
    font-weight: bold;
    color: #333;
  }
  
  .code-cell code {
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
  
  .status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status.available {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  .status.used {
    background: #ffebee;
    color: #c62828;
  }
  
  .status.expired {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .status.completed {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  .status.pending {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .status.failed {
    background: #ffebee;
    color: #c62828;
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
    max-width: 500px;
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
    .admin-kits-page {
      padding: 1rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .modal {
      padding: 1.5rem;
    }
  }
</style> 