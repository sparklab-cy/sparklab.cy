<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { cart, type CartItem } from '$lib/stores/cart';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let cartState = $state<{ items: CartItem[]; isOpen: boolean }>({ items: [], isOpen: false });
  
  cart.subscribe((state) => {
    cartState = state;
  });

  const shopifyEnabled = $derived(Boolean(page.data.shopifyEnabled));

  type ShopifyLine = {
    id: string;
    quantity: number;
    title: string;
    variantTitle?: string;
    price: string;
    currency: string;
    imageUrl?: string;
  };

  type ShopifyCartApi = {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
    totalAmount: string;
    currencyCode: string;
    lines: ShopifyLine[];
  } | null;

  let shopifyCart = $state<ShopifyCartApi>(null);
  let shopifyLoading = $state(false);

  async function refreshShopifyCart() {
    shopifyLoading = true;
    try {
      const r = await fetch('/api/shop/cart');
      const d = await r.json();
      shopifyCart = d.cart ?? null;
    } finally {
      shopifyLoading = false;
    }
  }

  $effect(() => {
    if (cartState.isOpen && shopifyEnabled) {
      refreshShopifyCart();
    }
  });

  onMount(() => {
    const onUpdate = () => {
      if (shopifyEnabled) refreshShopifyCart();
    };
    window.addEventListener('shopify-cart-updated', onUpdate);
    return () => window.removeEventListener('shopify-cart-updated', onUpdate);
  });

  function formatLineMoney(amount: string, currency: string) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(parseFloat(amount));
    } catch {
      return `${currency} ${amount}`;
    }
  }
  
  function removeItem(itemId: string) {
    cart.removeItem(itemId);
  }
  
  function updateQuantity(itemId: string, quantity: number) {
    cart.updateQuantity(itemId, quantity);
  }

  async function removeShopifyLine(lineId: string) {
    await fetch('/api/shop/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', lineIds: [lineId] })
    });
    window.dispatchEvent(new CustomEvent('shopify-cart-updated'));
    await refreshShopifyCart();
  }

  async function shopifyQty(lineId: string, quantity: number) {
    await fetch('/api/shop/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', lineId, quantity })
    });
    window.dispatchEvent(new CustomEvent('shopify-cart-updated'));
    await refreshShopifyCart();
  }
  
  function closeCart() {
    cart.closeCart();
  }
  
  function proceedToCheckout() {
    dispatch('checkout');
    closeCart();
  }

  function goShopifyCheckout() {
    const url = shopifyCart?.checkoutUrl;
    if (url) window.location.href = url;
  }
  
  function getTotal() {
    return cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
</script>

{#if cartState.isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="cart-overlay" onclick={closeCart}>
    <div class="cart-panel" onclick={(e) => e.stopPropagation()}>
      <div class="cart-header">
        <h2>Shopping Cart</h2>
        <button type="button" class="close-btn" onclick={closeCart}>×</button>
      </div>
      
      {#if shopifyEnabled}
        {#if shopifyLoading}
          <div class="empty-cart"><p>Loading cart…</p></div>
        {:else if !shopifyCart?.lines?.length}
          <div class="empty-cart">
            <p>Your cart is empty</p>
            <button type="button" class="continue-shopping" onclick={closeCart}>
              Continue Shopping
            </button>
          </div>
        {:else}
          <div class="cart-items">
            {#each shopifyCart.lines as line}
              <div class="cart-item">
                <div class="item-image">
                  <img src={line.imageUrl || '/default-kit-image.jpg'} alt={line.title} />
                </div>
                <div class="item-details">
                  <h3>{line.title}</h3>
                  {#if line.variantTitle}
                    <p class="item-type">{line.variantTitle}</p>
                  {/if}
                  <p class="item-price">{formatLineMoney(line.price, line.currency)}</p>
                </div>
                <div class="item-quantity">
                  <button
                    type="button"
                    class="quantity-btn"
                    onclick={() => shopifyQty(line.id, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                  >-</button>
                  <span class="quantity">{line.quantity}</span>
                  <button type="button" class="quantity-btn" onclick={() => shopifyQty(line.id, line.quantity + 1)}>+</button>
                </div>
                <div class="item-total">
                  {formatLineMoney(
                    (parseFloat(line.price) * line.quantity).toFixed(2),
                    line.currency
                  )}
                </div>
                <button type="button" class="remove-btn" onclick={() => removeShopifyLine(line.id)} aria-label="Remove item">×</button>
              </div>
            {/each}
          </div>
          <div class="cart-footer">
            <div class="cart-total">
              <span>Total:</span>
              <span class="total-amount">
                {shopifyCart
                  ? formatLineMoney(shopifyCart.totalAmount, shopifyCart.currencyCode)
                  : ''}
              </span>
            </div>
            <div class="cart-actions">
              <button type="button" class="checkout-btn" onclick={goShopifyCheckout}>
                Checkout on Shopify
              </button>
            </div>
          </div>
        {/if}
      {:else if cartState.items.length === 0}
        <div class="empty-cart">
          <p>Your cart is empty</p>
          <button type="button" class="continue-shopping" onclick={closeCart}>
            Continue Shopping
          </button>
        </div>
      {:else}
        <div class="cart-items">
          {#each cartState.items as item}
            <div class="cart-item">
              <div class="item-image">
                <img src={item.image || '/default-kit-image.jpg'} alt={item.name} />
              </div>
              
              <div class="item-details">
                <h3>{item.name}</h3>
                <p class="item-type">{item.type === 'kit' ? 'Kit' : 'Course'}</p>
                <p class="item-price">${item.price}</p>
              </div>
              
              <div class="item-quantity">
                <button 
                  type="button"
                  class="quantity-btn" 
                  onclick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span class="quantity">{item.quantity}</span>
                <button 
                  type="button"
                  class="quantity-btn" 
                  onclick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              
              <div class="item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              
              <button 
                type="button"
                class="remove-btn" 
                onclick={() => removeItem(item.id)}
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          {/each}
        </div>
        
        <div class="cart-footer">
          <div class="cart-total">
            <span>Total:</span>
            <span class="total-amount">${getTotal().toFixed(2)}</span>
          </div>
          
          <div class="cart-actions">
            <button type="button" class="clear-cart" onclick={() => cart.clearCart()}>
              Clear Cart
            </button>
            <button type="button" class="checkout-btn" onclick={proceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .cart-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* Use theme-aware overlay - darker for dark mode, lighter for light mode */
    background: color-mix(in srgb, var(--color-text) 30%, transparent);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
    backdrop-filter: blur(2px);
  }
  
  .cart-panel {
    width: 100%;
    max-width: 450px;
    background: var(--secondary-background);
    border-left: var(--border-width) solid var(--border);
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: var(--border-width) solid var(--border);
  }
  
  .cart-header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-h2);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: color 0.2s;
  }
  
  .close-btn:hover {
    color: var(--color-text);
  }
  
  .empty-cart {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    text-align: center;
  }
  
  .empty-cart p {
    color: var(--muted);
    margin-bottom: 1rem;
  }
  
  .continue-shopping {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-background);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: var(--font-size);
    transition: background 0.2s, color 0.2s;
  }
  
  .continue-shopping:hover {
    background: var(--color-accent);
    color: var(--color-background);
  }
  
  .cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .cart-item {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border: var(--border-width) solid var(--border);
    border-radius: 8px;
    margin-bottom: 1rem;
    background: var(--color-background);
  }
  
  .item-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .item-details h3 {
    margin: 0 0 0.25rem 0;
    font-size: var(--font-size);
    color: var(--color-text);
  }
  
  .item-type {
    margin: 0 0 0.25rem 0;
    font-size: var(--font-size);
    color: var(--muted);
    text-transform: uppercase;
  }
  
  .item-price {
    margin: 0;
    font-weight: 500;
    color: var(--color-primary);
  }
  
  .item-quantity {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-btn {
    width: 28px;
    height: 28px;
    border: var(--border-width) solid var(--border);
    background: var(--color-background);
    color: var(--color-text);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: var(--font-size);
    transition: all 0.2s;
  }
  
  .quantity-btn:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-background);
    border-color: var(--color-primary);
  }
  
  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .quantity {
    min-width: 20px;
    text-align: center;
    font-weight: 500;
    color: var(--color-text);
  }
  
  .item-total {
    font-weight: 600;
    color: var(--color-text);
    min-width: 60px;
    text-align: right;
  }
  
  .remove-btn {
    background: none;
    border: none;
    color: var(--danger);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .remove-btn:hover {
    background: var(--danger);
    color: var(--color-background);
  }
  
  .cart-footer {
    padding: 1.5rem;
    border-top: var(--border-width) solid var(--border);
    background: var(--secondary-background);
  }
  
  .cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: var(--font-size-h3);
    font-weight: 600;
    color: var(--color-text);
  }
  
  .total-amount {
    color: var(--color-primary);
  }
  
  .cart-actions {
    display: flex;
    gap: 1rem;
  }
  
  .clear-cart {
    flex: 1;
    padding: 0.75rem;
    background: var(--secondary-background);
    border: var(--border-width) solid var(--border);
    color: var(--color-text);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: var(--font-size);
    transition: background 0.2s;
  }
  
  .clear-cart:hover {
    background: var(--border);
  }
  
  .checkout-btn {
    flex: 2;
    padding: 0.75rem;
    background: var(--color-primary);
    color: var(--color-background);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: var(--font-size);
    transition: background 0.2s, color 0.2s;
  }
  
  .checkout-btn:hover {
    background: var(--color-accent);
    color: var(--color-background);
  }
  
  @media (max-width: 768px) {
    .cart-panel {
      max-width: 100%;
    }
    
    .cart-item {
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
    }
    
    .item-quantity {
      grid-column: 1 / -1;
      justify-content: center;
      margin-top: 0.5rem;
    }
    
    .item-total {
      grid-column: 1 / -1;
      text-align: center;
      margin-top: 0.5rem;
    }
    
    .remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
    }
  }
</style>
