import type { PageServerLoad } from './$types';
import { isShopifyConfigured, fetchCatalogProducts } from '$lib/server/shopifyStorefront';

export const load: PageServerLoad = async () => {
	const shopifyEnabled = isShopifyConfigured();

	if (!shopifyEnabled) {
		return {
			products: [],
			shopifyEnabled: false,
			error:
				'Shopify is not configured. Set PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN in your environment.'
		};
	}

	try {
		const products = await fetchCatalogProducts();
		return {
			products,
			shopifyEnabled: true,
			error: null as string | null
		};
	} catch (e) {
		console.error('Shop catalog:', e);
		return {
			products: [],
			shopifyEnabled: true,
			error: 'Could not load products from Shopify. Check API credentials and Storefront API access.'
		};
	}
};
