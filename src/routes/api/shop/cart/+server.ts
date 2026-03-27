import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import {
	isShopifyConfigured,
	getCart,
	createCart,
	cartLinesAdd,
	cartLinesUpdate,
	cartLinesRemove,
	toVariantGid
} from '$lib/server/shopifyStorefront';

const CART_COOKIE = 'shopifyCartId';

function cookieOpts() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: !dev,
		maxAge: 60 * 60 * 24 * 60
	};
}

export const GET: RequestHandler = async ({ cookies }) => {
	if (!isShopifyConfigured()) {
		return json({ shopifyEnabled: false, cart: null, totalQuantity: 0 });
	}
	const cartId = cookies.get(CART_COOKIE);
	if (!cartId) {
		return json({ shopifyEnabled: true, cart: null, totalQuantity: 0 });
	}
	const cart = await getCart(cartId);
	if (!cart) {
		cookies.delete(CART_COOKIE, { path: '/' });
		return json({ shopifyEnabled: true, cart: null, totalQuantity: 0 });
	}
	return json({
		shopifyEnabled: true,
		cart,
		totalQuantity: cart.totalQuantity,
		checkoutUrl: cart.checkoutUrl
	});
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!isShopifyConfigured()) {
		return json({ success: false, error: 'Shopify not configured' }, { status: 400 });
	}
	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
	}
	const action = body.action as string;
	let cartId = cookies.get(CART_COOKIE);

	if (action === 'add') {
		const merchandiseId = body.merchandiseId as string;
		const quantity = Math.max(1, parseInt(String(body.quantity ?? '1'), 10) || 1);
		if (!merchandiseId) {
			return json({ success: false, error: 'merchandiseId required' }, { status: 400 });
		}
		if (!cartId) {
			const created = await createCart();
			if (!created) return json({ success: false, error: 'Could not create cart' }, { status: 500 });
			cartId = created.cartId;
			cookies.set(CART_COOKIE, cartId, cookieOpts());
		}
		const cart = await cartLinesAdd(cartId, [
			{ merchandiseId: toVariantGid(merchandiseId), quantity }
		]);
		if (!cart) return json({ success: false, error: 'Could not add to cart' }, { status: 500 });
		cookies.set(CART_COOKIE, cart.id, cookieOpts());
		return json({ success: true, cart });
	}

	if (action === 'update') {
		const lineId = body.lineId as string;
		const quantity = parseInt(String(body.quantity ?? '0'), 10);
		if (!cartId || !lineId) {
			return json({ success: false, error: 'Missing cart or line' }, { status: 400 });
		}
		if (quantity <= 0) {
			const cart = await cartLinesRemove(cartId, [lineId]);
			if (!cart) return json({ success: false, error: 'Could not update cart' }, { status: 500 });
			cookies.set(CART_COOKIE, cart.id, cookieOpts());
			return json({ success: true, cart });
		}
		const cart = await cartLinesUpdate(cartId, [{ id: lineId, quantity }]);
		if (!cart) return json({ success: false, error: 'Could not update cart' }, { status: 500 });
		cookies.set(CART_COOKIE, cart.id, cookieOpts());
		return json({ success: true, cart });
	}

	if (action === 'remove') {
		const lineIds = body.lineIds as string[];
		if (!cartId || !lineIds?.length) {
			return json({ success: false, error: 'Missing cart or lines' }, { status: 400 });
		}
		const cart = await cartLinesRemove(cartId, lineIds);
		if (!cart) return json({ success: false, error: 'Could not update cart' }, { status: 500 });
		cookies.set(CART_COOKIE, cart.id, cookieOpts());
		return json({ success: true, cart });
	}

	return json({ success: false, error: 'Unknown action' }, { status: 400 });
};
