<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  const { data, form } = $props();
  const { user } = data;
  
  let showQRScanner = $state(false);
  
  function toggleQRScanner() {
    showQRScanner = !showQRScanner;
  }
  
  function handleQRResult(result: string) {
    // Handle QR code scan result
    const codeInput = document.getElementById('code-input') as HTMLInputElement;
    if (codeInput) {
      codeInput.value = result;
    }
    showQRScanner = false;
  }
</script>

<div class="redeem-page">
  <div class="redeem-container">
    <h1>Redeem Kit Code</h1>
    <p class="description">
      Enter the unique code from your Electrofun kit or scan the QR code to unlock access to courses.
    </p>
    
    {#if form?.message}
      <div class="success">
        <h3>{form.message}</h3>
        {#if form.kit}
          <p>You now have access to <strong>{form.kit.name}</strong> (Level {form.kit.level})</p>
          <a href="/courses" class="button">View Courses</a>
        {/if}
      </div>
    {/if}
    
    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}
    
    <div class="redeem-options">
      <div class="option-card">
        <h3>Enter Code Manually</h3>
        <form method="POST" action="?/redeemCode" use:enhance>
          <div class="input-group">
            <input 
              id="code-input"
              type="text" 
              name="code" 
              placeholder="Enter your unique code here..."
              required
              autocomplete="off"
            />
          </div>
          <button type="submit" class="redeem-btn">Redeem Code</button>
        </form>
      </div>
      
      <div class="option-card">
        <h3>Scan QR Code</h3>
        <p>Scan the QR code from your kit packaging</p>
        <button class="scan-btn" on:click={toggleQRScanner}>
          {showQRScanner ? 'Cancel Scan' : 'Start QR Scanner'}
        </button>
        
        {#if showQRScanner}
          <div class="qr-scanner">
            <!-- QR Scanner component would go here -->
            <div class="scanner-placeholder">
              <p>QR Scanner Component</p>
              <p>This would integrate with a QR scanning library</p>
              <button on:click={() => handleQRResult('DEMO-CODE-123')}>
                Demo: Use Test Code
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="help-section">
      <h3>Need Help?</h3>
      <ul>
        <li>Your unique code can be found on the kit packaging or instruction manual</li>
        <li>Codes are case-sensitive - enter exactly as shown</li>
        <li>Each code can only be used once</li>
        <li>If you're having trouble, contact support</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .redeem-page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .redeem-container {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 3rem;
    max-width: 600px;
    width: 100%;
    box-shadow: var(--shadow-xl);
  }
  
  .redeem-container h1 {
    color: var(--text-primary);
    text-align: center;
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }
  
  .description {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
  }
  
  .success {
    background: var(--success-50);
    border: 1px solid var(--success-500);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .success h3 {
    color: var(--success-700);
    margin: 0 0 1rem 0;
  }
  
  .success p {
    color: var(--success-700);
    margin-bottom: 1rem;
  }
  
  .error {
    background: var(--error-50);
    color: var(--error-700);
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .redeem-options {
    display: grid;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .option-card {
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }
  
  .option-card h3 {
    color: var(--text-primary);
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
  }
  
  .option-card p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }
  
  .input-group {
    margin-bottom: 1rem;
  }
  
  .input-group input {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--border-primary);
    border-radius: 8px;
    font-size: 1rem;
    text-align: center;
    letter-spacing: 2px;
    font-family: 'Courier New', monospace;
    transition: border-color 0.3s;
  }
  
  .input-group input:focus {
    outline: none;
    border-color: var(--brand-primary);
  }
  
  .redeem-btn, .scan-btn {
    width: 100%;
    padding: 1rem;
    background: var(--brand-primary);
    color: var(--text-inverse);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .redeem-btn:hover, .scan-btn:hover {
    background: var(--primary-600);
  }
  
  .qr-scanner {
    margin-top: 1rem;
    padding: 2rem;
    border: 2px dashed var(--border-secondary);
    border-radius: 8px;
  }
  
  .scanner-placeholder {
    text-align: center;
    color: var(--text-secondary);
  }
  
  .scanner-placeholder button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--success-500);
    color: var(--text-inverse);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .help-section {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .help-section h3 {
    color: var(--text-primary);
    margin: 0 0 1rem 0;
  }
  
  .help-section ul {
    color: var(--text-secondary);
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .help-section li {
    margin-bottom: 0.5rem;
  }
  
  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: var(--success-500);
    color: var(--text-inverse);
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    transition: background 0.3s;
  }
  
  .button:hover {
    background: var(--success-600);
  }
  
  @media (max-width: 768px) {
    .redeem-container {
      padding: 2rem;
    }
    
    .redeem-container h1 {
      font-size: 2rem;
    }
  }
</style> 