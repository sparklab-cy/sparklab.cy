import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { fetchProductByHandle, isShopifyConfigured } from '$lib/server/shopifyStorefront';

export const load: PageServerLoad = async ({ params }) => {
	if (!isShopifyConfigured()) {
		error(503, 'Shop is not available.');
	}
	const product = await fetchProductByHandle(params.handle);
	if (!product) {
		error(404, 'Product not found');
	}
	return { product };
};
