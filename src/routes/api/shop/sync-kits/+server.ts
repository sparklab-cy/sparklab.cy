import { dev } from '$app/environment';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchCatalogProducts } from '$lib/server/shopifyStorefront';
import { syncKitsFromCatalogProducts } from '$lib/server/shopifyKitsSync';
import { isSupabaseAdminConfigured } from '$lib/server/supabaseAdmin';

/** Development only: run Shopify → `kits` sync and return counts. */
export const GET: RequestHandler = async () => {
	if (!dev) error(403, 'Only available in development');

	try {
		const products = await fetchCatalogProducts();
		await syncKitsFromCatalogProducts(products);
		return json({
			ok: true,
			count: products.length,
			supabaseServiceRoleConfigured: isSupabaseAdminConfigured()
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return json(
			{
				ok: false,
				error: message,
				supabaseServiceRoleConfigured: isSupabaseAdminConfigured()
			},
			{ status: 500 }
		);
	}
};
