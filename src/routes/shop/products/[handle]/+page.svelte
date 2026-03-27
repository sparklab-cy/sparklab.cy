<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import type { ShopifyProductDetail } from '$lib/server/shopifyStorefront';

	const { data } = $props();
	const product = data.product as ShopifyProductDetail;

	const defaultVariant =
		product.variants.find((v) => v.availableForSale) ?? product.variants[0]!;

	let selectedVariantId = $state(defaultVariant.id);

	const selectedVariant = $derived(
		product.variants.find((v) => v.id === selectedVariantId) ?? defaultVariant
	);

	const galleryImages = $derived.by(() => {
		const urls = product.images.map((i) => i.url).filter(Boolean);
		const seen = new Set<string>();
		const unique: string[] = [];
		for (const u of urls) {
			if (!seen.has(u)) {
				seen.add(u);
				unique.push(u);
			}
		}
		if (unique.length === 0 && product.imageUrl) unique.push(product.imageUrl);
		return unique;
	});

	let mainImage = $state(
		product.imageUrl || product.images[0]?.url || '/default-kit-image.jpg'
	);

	$effect(() => {
		const v = selectedVariant;
		if (v.imageUrl) {
			mainImage = v.imageUrl;
		}
	});

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

	async function addToCart() {
		const v = selectedVariant;
		if (!v.availableForSale) return;
		const res = await fetch('/api/shop/cart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'add',
				merchandiseId: v.id,
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

	async function buyNow() {
		const v = selectedVariant;
		if (!v.availableForSale) return;
		const res = await fetch('/api/shop/cart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action: 'add',
				merchandiseId: v.id,
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

<svelte:head>
	<title>{product.title} — Shop</title>
</svelte:head>

<div class="product-page">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/shop">Shop</a>
		<span class="sep" aria-hidden="true">/</span>
		<span class="current">{product.title}</span>
	</nav>

	<div class="layout">
		<div class="media">
			<div class="main-image-wrap">
				<img src={mainImage} alt="" class="main-image" />
			</div>
			{#if galleryImages.length > 1}
				<div class="thumbs" role="list">
					{#each galleryImages as url}
						<button
							type="button"
							class="thumb"
							class:active={mainImage === url}
							onclick={() => (mainImage = url)}
							aria-label="Show image"
						>
							<img src={url} alt="" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="detail">
			<h1>{product.title}</h1>

			{#if product.variants.length > 1}
				<div class="field">
					<label class="label" for="variant-select">Option</label>
					<select
						id="variant-select"
						class="select"
						bind:value={selectedVariantId}
						aria-label="Product variant"
					>
						{#each product.variants as v}
							<option value={v.id} disabled={!v.availableForSale}>
								{v.title}
								{!v.availableForSale ? ' (unavailable)' : ''}
								— {formatMoney(v.priceAmount, v.currencyCode)}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<p class="price">{formatMoney(selectedVariant.priceAmount, selectedVariant.currencyCode)}</p>

			<div class="actions">
				<button
					type="button"
					class="btn secondary"
					disabled={!selectedVariant.availableForSale}
					onclick={addToCart}
				>
					Add to cart
				</button>
				<button
					type="button"
					class="btn primary"
					disabled={!selectedVariant.availableForSale}
					onclick={buyNow}
				>
					Buy now
				</button>
			</div>

			{#if product.descriptionHtml}
				<div class="description">
					<!-- eslint-disable svelte/no-at-html-tags -- merchant-controlled product body from Shopify -->
					{@html product.descriptionHtml}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.product-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
	}

	.breadcrumb {
		font-size: var(--font-size);
		color: var(--muted);
		margin-bottom: 1.5rem;
	}

	.breadcrumb a {
		color: var(--color-primary);
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.sep {
		margin: 0 0.35rem;
	}

	.current {
		color: var(--color-text);
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
		align-items: start;
	}

	@media (max-width: 800px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}

	.main-image-wrap {
		border-radius: 12px;
		overflow: hidden;
		border: var(--border-width) solid var(--border);
		background: var(--color-background);
		aspect-ratio: 1;
	}

	.main-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.thumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.thumb {
		padding: 0;
		border: 2px solid transparent;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		background: var(--secondary-background);
		width: 72px;
		height: 72px;
	}

	.thumb.active {
		border-color: var(--color-primary);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.detail h1 {
		margin: 0 0 1rem;
		font-size: var(--font-size-h1);
		color: var(--color-text);
		line-height: 1.2;
	}

	.field {
		margin-bottom: 1rem;
	}

	.label {
		display: block;
		font-size: var(--font-size);
		font-weight: 600;
		margin-bottom: 0.35rem;
		color: var(--color-text);
	}

	.select {
		width: 100%;
		max-width: 28rem;
		padding: 0.65rem 1rem;
		border: var(--border-width) solid var(--border);
		border-radius: 8px;
		background: var(--color-background);
		color: var(--color-text);
		font-size: var(--font-size);
	}

	.price {
		font-size: var(--font-size-h2);
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 1.25rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.25rem;
		border-radius: 8px;
		font-size: var(--font-size);
		font-weight: 600;
		cursor: pointer;
		border: var(--border-width) solid transparent;
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

	.description {
		font-size: var(--font-size);
		color: var(--color-text);
		line-height: 1.6;
		border-top: var(--border-width) solid var(--border);
		padding-top: 1.5rem;
	}

	.description :global(p) {
		margin: 0 0 1rem;
	}

	.description :global(p:last-child) {
		margin-bottom: 0;
	}

	.description :global(ul),
	.description :global(ol) {
		margin: 0 0 1rem;
		padding-left: 1.25rem;
	}
</style>
