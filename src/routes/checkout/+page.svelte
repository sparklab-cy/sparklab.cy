<script lang="ts">
  import { cart, type CartItem } from '$lib/stores/cart';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let cartState = $state<{ items: CartItem[]; isOpen: boolean }>({ items: [], isOpen: false });
  let isProcessing = $state(false);
  
  cart.subscribe(state => {
    cartState = state;
  });
  
  function getTotal() {
    return cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  function getSubtotal() {
    return getTotal();
  }
  
  function getTax() {
    return getSubtotal() * 0.08; // 8% tax
  }
  
  function getGrandTotal() {
    return getSubtotal() + getTax();
  }
  
  function handleCheckout() {
    isProcessing = true;
    // TODO: Implement payment processing
    setTimeout(() => {
      isProcessing = false;
      cart.clearCart();
      goto('/dashboard?message=order-success');
    }, 2000);
  }
</script>

<div class="checkout-page">
  <div class="checkout-container">
    <div class="checkout-header">
      <h1>Checkout</h1>
      <a href="/shop" class="continue-shopping">← Continue Shopping</a>
    </div>
    
    {#if cartState.items.length === 0}
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart to continue with checkout.</p>
        <a href="/shop" class="shop-btn">Go to Shop</a>
      </div>
    {:else}
      <div class="checkout-content">
        <!-- Order Summary -->
        <div class="order-summary">
          <h2>Order Summary</h2>
          
          <div class="cart-items">
            {#each cartState.items as item}
              <div class="cart-item">
                <div class="item-image">
                  <img src={item.image || '/default-kit-image.jpg'} alt={item.name} />
                </div>
                
                <div class="item-details">
                  <h3>{item.name}</h3>
                  <p class="item-type">{item.type === 'kit' ? 'Kit' : 'Course'}</p>
                  <p class="item-price">${item.price} × {item.quantity}</p>
                </div>
                
                <div class="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            {/each}
          </div>
          
          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (8%):</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total:</span>
              <span>${getGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Payment Form -->
        <div class="payment-form">
          <h2>Payment Information</h2>
          
          <form method="POST" action="?/processPayment" use:enhance={() => {
            isProcessing = true;
            return async ({ result }) => {
              isProcessing = false;
              if (result.type === 'success') {
                cart.clearCart();
                goto('/dashboard?message=order-success');
              }
            };
          }}>
            <div class="form-section">
              <h3>Contact Information</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">First Name</label>
                  <input type="text" id="firstName" name="firstName" required />
                </div>
                <div class="form-group">
                  <label for="lastName">Last Name</label>
                  <input type="text" id="lastName" name="lastName" required />
                </div>
              </div>
              
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
            </div>
            
            <div class="form-section">
              <h3>Payment Method</h3>
              <div class="payment-methods">
                <label class="payment-method">
                  <input type="radio" name="paymentMethod" value="card" checked />
                  <span class="method-label">Credit/Debit Card</span>
                </label>
                <label class="payment-method">
                  <input type="radio" name="paymentMethod" value="paypal" />
                  <span class="method-label">PayPal</span>
                </label>
              </div>
              
              <div class="form-group">
                <label for="cardNumber">Card Number</label>
                <input type="text" id="cardNumber" name="cardNumber" placeholder="1234 5678 9012 3456" required />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="expiry">Expiry Date</label>
                  <input type="text" id="expiry" name="expiry" placeholder="MM/YY" required />
                </div>
                <div class="form-group">
                  <label for="cvv">CVV</label>
                  <input type="text" id="cvv" name="cvv" placeholder="123" required />
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Billing Address</h3>
              <div class="form-group">
                <label for="address">Address</label>
                <input type="text" id="address" name="address" required />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="city">City</label>
                  <input type="text" id="city" name="city" required />
                </div>
                <div class="form-group">
                  <label for="state">State</label>
                  <input type="text" id="state" name="state" required />
                </div>
              </div>
              
              <div class="form-group">
                <label for="zipCode">ZIP Code</label>
                <input type="text" id="zipCode" name="zipCode" required />
              </div>
            </div>
            
            <div class="form-actions">
              <button 
                type="submit" 
                class="pay-btn" 
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay $${getGrandTotal().toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .checkout-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .checkout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .checkout-header h1 {
    color: var(--text);
    margin: 0;
  }
  
  .continue-shopping {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
  }
  
  .continue-shopping:hover {
    text-decoration: underline;
  }
  
  .empty-cart {
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .empty-cart h2 {
    color: var(--text);
    margin-bottom: 1rem;
  }
  
  .empty-cart p {
    color: var(--muted);
    margin-bottom: 2rem;
  }
  
  .shop-btn {
    display: inline-block;
    padding: 1rem 2rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .checkout-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  
  .order-summary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    height: fit-content;
  }
  
  .order-summary h2 {
    color: var(--text);
    margin-bottom: 1.5rem;
  }
  
  .cart-items {
    margin-bottom: 2rem;
  }
  
  .cart-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border);
  }
  
  .cart-item:last-child {
    border-bottom: none;
  }
  
  .item-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }
  
  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .item-details {
    flex: 1;
  }
  
  .item-details h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    color: var(--text);
  }
  
  .item-type {
    margin: 0 0 0.25rem 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
  }
  
  .item-price {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .item-total {
    font-weight: 600;
    color: var(--text);
    align-self: center;
  }
  
  .order-totals {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: var(--text);
  }
  
  .grand-total {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-color);
    border-top: 1px solid var(--border);
    padding-top: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .payment-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
  }
  
  .payment-form h2 {
    color: var(--text);
    margin-bottom: 1.5rem;
  }
  
  .form-section {
    margin-bottom: 2rem;
  }
  
  .form-section h3 {
    color: var(--text);
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text);
    font-weight: 500;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--background);
    color: var(--text);
    font-size: 1rem;
  }
  
  .form-group input:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  .payment-methods {
    margin-bottom: 1rem;
  }
  
  .payment-method {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }
  
  .method-label {
    color: var(--text);
  }
  
  .form-actions {
    margin-top: 2rem;
  }
  
  .pay-btn {
    width: 100%;
    padding: 1rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .pay-btn:hover:not(:disabled) {
    background: var(--primary-dark);
  }
  
  .pay-btn:disabled {
    background: var(--muted);
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    .checkout-content {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .checkout-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style> 