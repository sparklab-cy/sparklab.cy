import type { ShopifyCatalogProduct, ShopifyProductDetail } from './shopifyStorefront';
import { getSupabaseAdmin } from './supabaseAdmin';

const THEME_DEFAULT = 'General';
const LEVEL_DEFAULT = 1;
const CHUNK = 40;

function stripHtml(html: string): string {
	if (!html) return '';
	return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

type KitPreserve = {
	shopify_handle: string;
	qr_code: string | null;
	access_code: string | null;
	specifications: unknown;
};

function mergeSpecs(prev: unknown, shopifyBlock: Record<string, unknown>): Record<string, unknown> {
	const base =
		typeof prev === 'object' && prev !== null && !Array.isArray(prev)
			? { ...(prev as Record<string, unknown>) }
			: {};
	return { ...base, shopify: shopifyBlock };
}

/**
 * Upsert kits from Shopify catalog rows (runs when the shop catalog is loaded).
 * Requires `PRIVATE_SUPABASE_SERVICE_ROLE_KEY` and a unique `shopify_handle` on `kits`.
 */
export async function syncKitsFromCatalogProducts(
	products: ShopifyCatalogProduct[]
): Promise<void> {
	const admin = getSupabaseAdmin();
	if (!admin) {
		if (import.meta.env.DEV) {
			console.warn(
				'[shopifyKitsSync] Skipped: no service role key. Set PRIVATE_SUPABASE_SERVICE_ROLE_KEY in .env (Supabase → Settings → API → service_role).'
			);
		}
		return;
	}
	if (products.length === 0) return;

	const unique = [...new Map(products.map((p) => [p.handle, p])).values()];
	const handles = unique.map((p) => p.handle);
	const { data: existing, error: fetchErr } = await admin
		.from('kits')
		.select('shopify_handle, qr_code, access_code, specifications')
		.in('shopify_handle', handles);

	if (fetchErr) {
		console.error('shopifyKitsSync: could not read existing kits:', fetchErr);
		return;
	}

	const preserve = new Map<string, KitPreserve>(
		(existing ?? []).map((r) => [
			r.shopify_handle as string,
			r as KitPreserve
		])
	);

	const rows = unique.map((p) => {
		const prev = preserve.get(p.handle);
		const shopifyBlock = {
			product_id: p.id,
			default_variant_id: p.variantId,
			currency_code: p.currencyCode,
			synced_from: 'shopify_catalog' as const
		};
		return {
			shopify_handle: p.handle,
			name: p.title,
			theme: THEME_DEFAULT,
			level: LEVEL_DEFAULT,
			description: (p.description || 'No description.').slice(0, 20000),
			price: p.priceAmount,
			image_url: p.imageUrl,
			kit_type: 'normal' as const,
			images: p.imageUrl ? [p.imageUrl] : [],
			specifications: mergeSpecs(prev?.specifications, shopifyBlock),
			...(prev
				? {
						qr_code: prev.qr_code,
						access_code: prev.access_code
					}
				: {})
		};
	});

	for (let i = 0; i < rows.length; i += CHUNK) {
		const chunk = rows.slice(i, i + CHUNK);
		const { error } = await admin.from('kits').upsert(chunk, {
			onConflict: 'shopify_handle'
		});
		if (error) {
			console.error('shopifyKitsSync: upsert failed:', error);
			return;
		}
	}
}

/** Upsert a single kit when a product detail page is loaded (richer description & images). */
export async function syncKitFromProductDetail(product: ShopifyProductDetail): Promise<void> {
	const admin = getSupabaseAdmin();
	if (!admin) {
		if (import.meta.env.DEV) {
			console.warn(
				'[shopifyKitsSync] Skipped detail sync: no PRIVATE_SUPABASE_SERVICE_ROLE_KEY in .env'
			);
		}
		return;
	}

	const price = Math.min(...product.variants.map((v) => v.priceAmount));
	const desc = stripHtml(product.descriptionHtml).slice(0, 20000) || 'No description.';
	const imageUrls = [...new Set(product.images.map((i) => i.url).filter(Boolean))];
	if (product.imageUrl && !imageUrls.includes(product.imageUrl)) {
		imageUrls.unshift(product.imageUrl);
	}

	const { data: existing, error: fetchErr } = await admin
		.from('kits')
		.select('qr_code, access_code, specifications')
		.eq('shopify_handle', product.handle)
		.maybeSingle();

	if (fetchErr) {
		console.error('shopifyKitsSync: read kit for detail sync:', fetchErr);
		return;
	}

	const shopifyBlock = {
		product_id: product.id,
		product_handle: product.handle,
		variant_ids: product.variants.map((v) => v.id),
		synced_from: 'shopify_product_detail' as const
	};

	const row = {
		shopify_handle: product.handle,
		name: product.title,
		theme: THEME_DEFAULT,
		level: LEVEL_DEFAULT,
		description: desc,
		price,
		image_url: product.imageUrl ?? imageUrls[0] ?? null,
		kit_type: 'normal' as const,
		images: imageUrls.length ? imageUrls : [],
		specifications: mergeSpecs(existing?.specifications, shopifyBlock),
		...(existing
			? {
					qr_code: existing.qr_code,
					access_code: existing.access_code
				}
			: {})
	};

	const { error } = await admin.from('kits').upsert(row, { onConflict: 'shopify_handle' });
	if (error) console.error('shopifyKitsSync: detail upsert failed:', error);
}
