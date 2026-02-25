<script lang="ts">
  import { cart, type CartItem } from '$lib/stores/cart';
  
  let cartState = $state<{ items: CartItem[]; isOpen: boolean }>({ items: [], isOpen: false });
  let itemCount = $state(0);
  
  cart.subscribe(state => {
    cartState = state;
    itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  });
  
  function openCart() {
    cart.openCart();
  }
</script>

<button class="cart-icon" onclick={openCart} aria-label="Shopping cart">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    <path d="M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
  
  {#if itemCount > 0}
    <span class="cart-badge">{itemCount}</span>
  {/if}
</button>

<style>
  .cart-icon {
    position: relative;
    background: none;
    border: var(--border-width) solid var(--color-text);
    border-radius: 8px;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    transition: all 0.2s ease;
  }
  
  .cart-icon:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(94, 96, 206, 0.05);
  }
  
  .cart-badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--color-primary);
    color: var(--color-background);
    font-size: var(--font-size);
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    transform: translate(50%, -50%);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
</style>
