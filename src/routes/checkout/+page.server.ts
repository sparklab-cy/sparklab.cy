import type { PageServerLoad } from './$types';
import { isShopifyConfigured, getCart } from '$lib/server/shopifyStorefront';

const CART_COOKIE = 'shopifyCartId';

export const load: PageServerLoad = async ({ cookies }) => {
	const shopifyEnabled = isShopifyConfigured();
	if (!shopifyEnabled) {
		return { shopifyEnabled: false as const, shopifyCart: null };
	}
	const cartId = cookies.get(CART_COOKIE);
	if (!cartId) {
		return { shopifyEnabled: true as const, shopifyCart: null };
	}
	const shopifyCart = await getCart(cartId);
	return { shopifyEnabled: true as const, shopifyCart };
};
