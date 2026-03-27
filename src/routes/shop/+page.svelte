<script lang="ts">
	import { cart } from '$lib/stores/cart';
	type ShopProduct = {
		id: string;
		handle: string;
		title: string;
		description: string;
		imageUrl: string | null;
		variantId: string;
		priceAmount: number;
		currencyCode: string;
		availableForSale: boolean;
	};

	const { data } = $props();
	const products = $derived(data.products ?? []);
	const { error, shopifyEnabled } = data;

	let searchQuery = $state('');
	let sortBy = $state<'title' | 'price-asc' | 'price-desc'>('title');

	const filteredProducts = $derived(
		products
			.filter((p) => {
				const q = searchQuery.trim().toLowerCase();
				if (!q) return true;
				return (
					p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
				);
			})
			.slice()
			.sort((a, b) => {
				switch (sortBy) {
					case 'price-asc':
						return a.priceAmount - b.priceAmount;
					case 'price-desc':
						return b.priceAmount - a.priceAmount;
					default:
						return a.title.localeCompare(b.title);
				}
			})
	);

	function formatMoney(amount: number, currency: string) {
		try {
			return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
		} catch {
			return `${currency} ${amount.toFixed(2)}`;
		}
	}

	function notifyShopifyCart() {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('shopify-cart-updated'));
		}
	}

	function productPath(handle: string) {
		return `/shop/products/${handle}`;
	}

	async function addToCart(p: ShopProduct) {
		if (!p.availableForSale) return;
		const res = await fetch('/api/shop/cart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'add',
				merchandiseId: p.variantId,
				quantity: 1
			})
		});
		const j = await res.json();
		if (!res.ok || !j.success) {
			console.error(j);
			return;
		}
		notifyShopifyCart();
		cart.openCart();
	}

	async function buyNow(p: ShopProduct) {
		if (!p.availableForSale) return;
		const res = await fetch('/api/shop/cart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'add',
				merchandiseId: p.variantId,
				quantity: 1
			})
		});
		const j = await res.json();
		if (!res.ok || !j.success) {
			console.error(j);
			return;
		}
		notifyShopifyCart();
		const r = await fetch('/api/shop/cart');
		const d = await r.json();
		if (d.checkoutUrl && typeof d.checkoutUrl === 'string') {
			window.location.href = d.checkoutUrl;
		}
	}
</script>

<div class="shop-page">
	<h1>Shop</h1>
	<p class="lead">All purchases are completed securely through Shopify checkout.</p>

	{#if error}
		<div class="message error">{error}</div>
	{:else if !shopifyEnabled}
		<div class="message error">Shopify is not configured.</div>
	{:else}
		<div class="toolbar">
			<input
				type="search"
				class="search"
				placeholder="Search products…"
				bind:value={searchQuery}
				aria-label="Search products"
			/>
			<select class="sort" bind:value={sortBy} aria-label="Sort products">
				<option value="title">Name</option>
				<option value="price-asc">Price: low to high</option>
				<option value="price-desc">Price: high to low</option>
			</select>
		</div>

		<p class="results-meta">{filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}</p>

		{#if filteredProducts.length === 0}
			<p class="empty">No products to show. Add products in Shopify Admin or assign them to your collection.</p>
		{:else}
			<div class="grid">
				{#each filteredProducts as p}
					<article class="card">
						<a href={productPath(p.handle)} class="card-image-link">
							<img
								src={p.imageUrl || '/default-kit-image.jpg'}
								alt=""
								class="card-image"
							/>
						</a>
						<div class="card-body">
							<h2 class="card-title">
								<a href={productPath(p.handle)} class="card-title-link">{p.title}</a>
							</h2>
							<p class="card-desc">{p.description}</p>
							<p class="card-price">{formatMoney(p.priceAmount, p.currencyCode)}</p>
							<div class="card-actions">
								<button
									type="button"
									class="btn secondary"
									disabled={!p.availableForSale}
									onclick={() => addToCart(p)}
								>
									Add to cart
								</button>
								<button
									type="button"
									class="btn primary"
									disabled={!p.availableForSale}
									onclick={() => buyNow(p)}
								>
									Buy now
								</button>
								<a class="btn link" href={productPath(p.handle)}>View details</a>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.shop-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		text-align: center;
		color: var(--color-text);
		font-size: var(--font-size-h1);
		margin-bottom: 0.5rem;
	}

	.lead {
		text-align: center;
		color: var(--muted);
		margin: 0 0 2rem;
		font-size: var(--font-size);
	}

	.message.error {
		padding: 1rem 1.25rem;
		border-radius: 8px;
		border: 1px solid #dc3545;
		background: rgba(220, 53, 69, 0.08);
		color: #dc3545;
		max-width: 560px;
		margin: 0 auto;
		text-align: center;
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
		align-items: center;
	}

	.search {
		flex: 1;
		min-width: 200px;
		padding: 0.65rem 1rem;
		border: var(--border-width) solid var(--border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--font-size);
	}

	.sort {
		padding: 0.65rem 1rem;
		border: var(--border-width) solid var(--border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--font-size);
	}

	.results-meta {
		color: var(--muted);
		font-size: var(--font-size);
		margin-bottom: 1.5rem;
	}

	.empty {
		text-align: center;
		color: var(--muted);
		padding: 2rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.card {
		border: var(--border-width) solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		background: var(--secondary-background);
		display: flex;
		flex-direction: column;
	}

	.card-image-link {
		display: block;
		aspect-ratio: 4 / 3;
		background: var(--color-background);
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.75rem;
	}

	.card-title {
		margin: 0;
		font-size: var(--font-size-h3);
		color: var(--color-text);
		line-height: 1.25;
	}

	.card-title-link {
		color: inherit;
		text-decoration: none;
	}

	.card-title-link:hover {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.card-desc {
		margin: 0;
		font-size: var(--font-size);
		color: var(--color-text);
		line-height: 1.5;
		flex: 1;
		display: -webkit-box;
		line-clamp: 4;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-price {
		margin: 0;
		font-size: var(--font-size-h3);
		font-weight: 700;
		color: var(--color-primary);
	}

	.card-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1rem;
		border-radius: 8px;
		font-size: var(--font-size);
		font-weight: 600;
		cursor: pointer;
		border: var(--border-width) solid transparent;
		text-decoration: none;
		text-align: center;
		box-sizing: border-box;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.primary {
		background: var(--color-primary);
		color: var(--color-background);
		border-color: var(--color-primary);
	}

	.btn.primary:hover:not(:disabled) {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.btn.secondary {
		background: var(--secondary-background);
		color: var(--color-text);
		border-color: var(--border);
	}

	.btn.secondary:hover:not(:disabled) {
		border-color: var(--color-primary);
	}

	.btn.link {
		background: transparent;
		color: var(--color-primary);
		border-color: transparent;
		text-decoration: underline;
		text-underline-offset: 3px;
		font-weight: 500;
	}

	.btn.link:hover {
		color: var(--color-accent);
	}
</style>
