<script lang="ts">
  import { enhance } from '$app/forms';

  const { data, form } = $props();
  const { user } = data;

  let showQRScanner = $state(false);

  function toggleQRScanner() {
    showQRScanner = !showQRScanner;
  }

  function handleQRResult(result: string) {
    const codeInput = document.getElementById('code-input') as HTMLInputElement;
    if (codeInput) {
      codeInput.value = result;
    }
    showQRScanner = false;
  }
</script>

<div class="redeem-page">
  <header class="page-header animate-in">
    <h1>Redeem Kit Code</h1>
    <p>Enter the unique code from your kit or scan the QR code to unlock access to courses.</p>
  </header>

  {#if form?.message}
    <div class="banner banner-success animate-in">
      <strong>{form.message}</strong>
      {#if form.kit}
        <p>You now have access to <strong>{form.kit.name}</strong> (Level {form.kit.level})</p>
        <a href="/courses" class="btn-primary btn-sm">View Courses</a>
      {/if}
    </div>
  {/if}

  {#if form?.error}
    <div class="banner banner-error animate-in">{form.error}</div>
  {/if}

  <div class="options-grid">
    <section class="option-card animate-in delay-1">
      <h2>Enter Code</h2>
      <p>Type the code from your kit packaging or instruction manual.</p>
      <form method="POST" action="?/redeemCode" use:enhance>
        <input
          id="code-input"
          type="text"
          name="code"
          class="code-input"
          placeholder="XXXX-XXXX-XXXX"
          required
          autocomplete="off"
        />
        <button type="submit" class="btn-primary btn-full">Redeem Code</button>
      </form>
    </section>

    <section class="option-card animate-in delay-2">
      <h2>Scan QR Code</h2>
      <p>Use your camera to scan the QR code on the kit packaging.</p>
      <button class="btn-secondary btn-full" onclick={toggleQRScanner}>
        {showQRScanner ? 'Cancel Scan' : 'Start QR Scanner'}
      </button>

      {#if showQRScanner}
        <div class="qr-area">
          <p>QR scanner placeholder</p>
          <button class="btn-sm btn-tertiary" onclick={() => handleQRResult('DEMO-CODE-123')}>
            Demo: Use Test Code
          </button>
        </div>
      {/if}
    </section>
  </div>

  <section class="help-card animate-in delay-3">
    <h2>Need Help?</h2>
    <ul>
      <li>Your code is on the kit packaging or inside the instruction manual.</li>
      <li>Codes are case-sensitive. Enter exactly as shown.</li>
      <li>Each code can only be used once.</li>
      <li>Having trouble? <a href="/support">Contact support</a>.</li>
    </ul>
  </section>
</div>

<style>
  .redeem-page {
    max-width: 720px;
    margin: 0 auto;
    padding: 2.5rem 2rem 4rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.5rem;
    font-size: var(--font-size-h1);
    color: var(--color-text);
  }

  .page-header p {
    margin: 0 auto;
    max-width: 560px;
    color: var(--muted);
    line-height: 1.8;
    font-size: 1rem;
  }

  .banner {
    text-align: center;
    padding: 1rem 1.25rem;
    border-radius: var(--radius);
    margin-bottom: 1.5rem;
    font-weight: 700;
    font-size: 0.92rem;
  }

  .banner p {
    margin: 0.5rem 0 0.8rem;
    font-weight: 500;
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

  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .option-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    padding: 1.5rem;
  }

  .option-card h2 {
    margin: 0 0 0.4rem;
    font-size: var(--font-size-h3);
    color: var(--color-text);
  }

  .option-card p {
    margin: 0 0 1rem;
    color: var(--muted);
    line-height: 1.6;
    font-size: 0.92rem;
  }

  .code-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text);
    font-size: 1.05rem;
    font-family: 'Courier New', monospace;
    text-align: center;
    letter-spacing: 2px;
    margin-bottom: 0.75rem;
  }

  .code-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .btn-primary,
  .btn-secondary,
  .btn-tertiary {
    display: inline-block;
    padding: 0.65rem 1.2rem;
    border-radius: 8px;
    font-weight: 800;
    font-size: 0.92rem;
    border: none;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
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

  .btn-tertiary {
    background: var(--color-tertiary);
    color: #fff;
  }

  .btn-primary:hover,
  .btn-secondary:hover,
  .btn-tertiary:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  .btn-full {
    width: 100%;
    display: block;
  }

  .btn-sm {
    padding: 0.45rem 0.95rem;
    font-size: 0.85rem;
  }

  .qr-area {
    margin-top: 1rem;
    padding: 1.5rem;
    border: 2px dashed var(--border);
    border-radius: 8px;
    text-align: center;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .qr-area p {
    margin: 0 0 0.75rem;
  }

  .help-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--secondary-background);
    padding: 1.25rem 1.5rem;
  }

  .help-card h2 {
    margin: 0 0 0.75rem;
    font-size: var(--font-size-h3);
    color: var(--color-text);
  }

  .help-card ul {
    margin: 0;
    padding-left: 1.3rem;
    color: var(--muted);
    line-height: 1.7;
    font-size: 0.92rem;
  }

  .help-card li {
    margin-bottom: 0.35rem;
  }

  @media (max-width: 640px) {
    .redeem-page {
      padding: 2rem 1.25rem 3rem;
    }

    .options-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
