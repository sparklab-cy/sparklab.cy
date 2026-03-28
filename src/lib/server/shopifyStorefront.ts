import {
	PUBLIC_SHOPIFY_STORE_DOMAIN,
	PUBLIC_SHOPIFY_STOREFRONT_TOKEN,
	PUBLIC_SHOPIFY_API_VERSION
} from '$env/static/public';

const DEFAULT_API_VERSION = '2025-01';

export function isShopifyConfigured(): boolean {
	return Boolean(PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() && PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.trim());
}

function apiVersion(): string {
	return (PUBLIC_SHOPIFY_API_VERSION || DEFAULT_API_VERSION).trim();
}

function endpoint(): string {
	const domain = PUBLIC_SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, '').replace(/\/$/, '');
	return `https://${domain}/api/${apiVersion()}/graphql.json`;
}

export async function storefrontQuery<T>(params: {
	query: string;
	variables?: Record<string, unknown>;
}): Promise<{ data?: T; errors?: { message: string }[] }> {
	if (!isShopifyConfigured()) {
		throw new Error('Shopify is not configured');
	}

	const res = await fetch(endpoint(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Shopify-Storefront-Access-Token': PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
		},
		body: JSON.stringify({
			query: params.query,
			variables: params.variables ?? {}
		})
	});

	const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
	if (!res.ok) {
		throw new Error(`Shopify HTTP ${res.status}`);
	}
	return json;
}

/** Products for the /shop catalog (Shopify-only). */
export type ShopifyCatalogProduct = {
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

type CatalogProductGql = {
	id: string;
	handle: string;
	title: string;
	description: string;
	featuredImage?: { url: string } | null;
	variants: {
		edges: {
			node: {
				id: string;
				availableForSale: boolean;
				price: { amount: string; currencyCode: string };
			};
		}[];
	};
};

function mapCatalogProduct(node: CatalogProductGql): ShopifyCatalogProduct | null {
	const variantNodes = node.variants.edges.map((e) => e.node);
	if (variantNodes.length === 0) return null;
	const chosen =
		variantNodes.find((v) => v.availableForSale) ?? variantNodes[0];
	return {
		id: node.id,
		handle: node.handle,
		title: node.title,
		description: node.description ?? '',
		imageUrl: node.featuredImage?.url ?? null,
		variantId: chosen.id,
		priceAmount: parseFloat(chosen.price.amount),
		currencyCode: chosen.price.currencyCode,
		availableForSale: chosen.availableForSale
	};
}

/** All purchasable products for the storefront shop page (paginated). */
export async function fetchCatalogProducts(): Promise<ShopifyCatalogProduct[]> {
	if (!isShopifyConfigured()) return [];

	const out: ShopifyCatalogProduct[] = [];

	const catalogNodeFields = `
							id
							handle
							title
							description(truncateAt: 320)
							featuredImage { url }
							variants(first: 50) {
								edges {
									node {
										id
										availableForSale
										price { amount currencyCode }
									}
								}
							}
						}
						`;

	type CatalogAllData = {
		products: {
			pageInfo: { hasNextPage: boolean; endCursor: string | null };
			edges: { node: CatalogProductGql }[];
		};
	};

	let cursor: string | null = null;
	for (let i = 0; i < 15; i++) {
		const res = (await storefrontQuery<CatalogAllData>({
			query:
				'query CatalogAllProducts($cursor: String) { products(first: 50, after: $cursor) { pageInfo { hasNextPage endCursor } edges { node { ' +
				catalogNodeFields +
				'} } }',
			variables: { cursor }
		})) as { data?: CatalogAllData; errors?: { message: string }[] };
		if (res.errors?.length) throw new Error(res.errors.map((e: { message: string }) => e.message).join('; '));
		const products = res.data?.products;
		const edges = products?.edges ?? [];
		for (const edge of edges) {
			const m = mapCatalogProduct(edge.node);
			if (m) out.push(m);
		}
		if (!products?.pageInfo.hasNextPage) break;
		cursor = products?.pageInfo.endCursor;
		if (!cursor) break;
	}
	return out;
}

/** Single product for /shop/products/[handle] — full description and all variants. */
export type ShopifyProductDetail = {
	id: string;
	handle: string;
	title: string;
	descriptionHtml: string;
	imageUrl: string | null;
	images: { url: string; altText: string | null }[];
	variants: {
		id: string;
		title: string;
		availableForSale: boolean;
		priceAmount: number;
		currencyCode: string;
		imageUrl: string | null;
	}[];
};

export async function fetchProductByHandle(
	handle: string
): Promise<ShopifyProductDetail | null> {
	if (!isShopifyConfigured() || !handle?.trim()) return null;

	type Row = {
		product: {
			id: string;
			handle: string;
			title: string;
			descriptionHtml: string;
			featuredImage?: { url: string } | null;
			images: {
				edges: { node: { url: string; altText: string | null } }[];
			};
			variants: {
				edges: {
					node: {
						id: string;
						title: string;
						availableForSale: boolean;
						price: { amount: string; currencyCode: string };
						image?: { url: string } | null;
					};
				}[];
			};
		} | null;
	};

	const { data, errors } = (await storefrontQuery<Row>({
		query: `
			query ProductByHandle($handle: String!) {
				product(handle: $handle) {
					id
					handle
					title
					descriptionHtml
					featuredImage { url }
					images(first: 20) {
						edges { node { url altText } }
					}
					variants(first: 50) {
						edges {
							node {
								id
								title
								availableForSale
								price { amount currencyCode }
								image { url }
							}
						}
					}
				}
			}
		`,
		variables: { handle: handle.trim() }
	})) as { data?: Row; errors?: { message: string }[] };

	if (errors?.length) {
		console.error('Shopify fetchProductByHandle:', errors);
		return null;
	}

	const p = data?.product;
	if (!p) return null;

	const variantEdges = p.variants.edges;
	if (variantEdges.length === 0) return null;

	const variants = variantEdges.map(({ node: v }) => ({
		id: v.id,
		title: v.title,
		availableForSale: v.availableForSale,
		priceAmount: parseFloat(v.price.amount),
		currencyCode: v.price.currencyCode,
		imageUrl: v.image?.url ?? null
	}));

	const images = p.images.edges.map((e) => ({
		url: e.node.url,
		altText: e.node.altText
	}));

	return {
		id: p.id,
		handle: p.handle,
		title: p.title,
		descriptionHtml: p.descriptionHtml ?? '',
		imageUrl: p.featuredImage?.url ?? images[0]?.url ?? null,
		images,
		variants
	};
}

export type ShopifyVariantInfo = {
	variantGid: string;
	priceAmount: number;
	currencyCode: string;
	imageUrl?: string;
};

function normalizeKitKey(sku: string | null | undefined, kitIds: Set<string>): string | null {
	if (!sku) return null;
	const trimmed = sku.trim();
	if (kitIds.has(trimmed)) return trimmed;
	const noDashes = trimmed.replace(/-/g, '');
	for (const id of kitIds) {
		if (id.replace(/-/g, '') === noDashes) return id;
	}
	return null;
}

/**
 * Map each Supabase kit id to a Shopify variant by matching variant SKU to kit UUID
 * (with or without dashes). Set SKU on each variant in Shopify Admin to the kit id.
 */
export async function fetchShopifyVariantMapForKits(
	kitIds: string[]
): Promise<Map<string, ShopifyVariantInfo>> {
	const map = new Map<string, ShopifyVariantInfo>();
	if (!isShopifyConfigured() || kitIds.length === 0) return map;

	const idSet = new Set(kitIds);

	type VariantNode = {
		id: string;
		sku?: string | null;
		price: { amount: string; currencyCode: string };
		image?: { url: string } | null;
	};

	type ProductNode = {
		variants: {
			edges: { node: VariantNode }[];
		};
	};

	const accumulate = (products: ProductNode[]) => {
		for (const p of products) {
			for (const { node: v } of p.variants.edges) {
				const kitKey = normalizeKitKey(v.sku ?? undefined, idSet);
				if (!kitKey || map.has(kitKey)) continue;
				map.set(kitKey, {
					variantGid: v.id,
					priceAmount: parseFloat(v.price.amount),
					currencyCode: v.price.currencyCode,
					imageUrl: v.image?.url
				});
			}
		}
	};

	type AllProductsSkuQuery = {
		products: {
			pageInfo: { hasNextPage: boolean; endCursor: string | null };
			edges: { node: ProductNode }[];
		};
	};

	let cursor: string | null = null;
	for (let page = 0; page < 20; page++) {
		const res = (await storefrontQuery<AllProductsSkuQuery>({
			query: `
				query AllProducts($cursor: String) {
					products(first: 50, after: $cursor) {
						pageInfo { hasNextPage endCursor }
						edges {
							node {
								variants(first: 100) {
									edges {
										node { id sku price { amount currencyCode } image { url } }
									}
								}
							}
						}
					}
				}
			`,
			variables: { cursor }
		})) as { data?: AllProductsSkuQuery; errors?: { message: string }[] };
		if (res.errors?.length) throw new Error(res.errors.map((e: { message: string }) => e.message).join('; '));
		const gqlData: AllProductsSkuQuery | undefined = res.data;
		const products = gqlData?.products;
		const edges = products?.edges ?? [];
		if (!edges.length) break;
		accumulate(edges.map((edge: { node: ProductNode }) => edge.node));
		if (!products?.pageInfo.hasNextPage || map.size >= kitIds.length) break;
		cursor = products?.pageInfo.endCursor;
		if (!cursor) break;
	}

	return map;
}

export type ShopifyCartLine = {
	id: string;
	quantity: number;
	title: string;
	variantTitle?: string;
	price: string;
	currency: string;
	imageUrl?: string;
};

export type ShopifyCartPayload = {
	id: string;
	checkoutUrl: string;
	totalQuantity: number;
	totalAmount: string;
	currencyCode: string;
	lines: ShopifyCartLine[];
};

export async function getCart(cartId: string): Promise<ShopifyCartPayload | null> {
	const { data, errors } = await storefrontQuery<{
		cart: {
			id: string;
			checkoutUrl: string;
			totalQuantity: number;
			cost: { totalAmount: { amount: string; currencyCode: string } };
			lines: {
				edges: {
					node: {
						id: string;
						quantity: number;
						merchandise: {
							id: string;
							title: string;
							price: { amount: string; currencyCode: string };
							image?: { url: string } | null;
							product: { title: string };
						};
					};
				}[];
			};
		} | null;
	}>({
		query: `
			query Cart($cartId: ID!) {
				cart(id: $cartId) {
					id
					checkoutUrl
					totalQuantity
					cost { totalAmount { amount currencyCode } }
					lines(first: 100) {
						edges {
							node {
								id
								quantity
								merchandise {
									... on ProductVariant {
										id
										title
										price { amount currencyCode }
										image { url }
										product { title }
									}
								}
							}
						}
					}
				}
			}
		`,
		variables: { cartId }
	});

	if (errors?.length) {
		console.error('Shopify getCart:', errors);
		return null;
	}

	const cart = data?.cart;
	if (!cart) return null;

	const lines: ShopifyCartLine[] = cart.lines.edges.map(({ node: line }) => {
		const m = line.merchandise;
		return {
			id: line.id,
			quantity: line.quantity,
			title: m.product?.title ?? m.title,
			variantTitle: m.title,
			price: m.price.amount,
			currency: m.price.currencyCode,
			imageUrl: m.image?.url ?? undefined
		};
	});

	return {
		id: cart.id,
		checkoutUrl: cart.checkoutUrl,
		totalQuantity: cart.totalQuantity,
		totalAmount: cart.cost.totalAmount.amount,
		currencyCode: cart.cost.totalAmount.currencyCode,
		lines
	};
}

export async function createCart(): Promise<{ cartId: string; checkoutUrl: string } | null> {
	const { data, errors } = await storefrontQuery<{
		cartCreate: {
			cart: { id: string; checkoutUrl: string } | null;
			userErrors: { field: string[]; message: string }[];
		};
	}>({
		query: `
			mutation CreateCart {
				cartCreate(input: {}) {
					cart { id checkoutUrl }
					userErrors { field message }
				}
			}
		`
	});

	if (errors?.length) {
		console.error('Shopify createCart:', errors);
		return null;
	}

	const created = data?.cartCreate;
	if (created?.userErrors?.length) {
		console.error('Shopify createCart userErrors:', created.userErrors);
		return null;
	}
	const cart = created?.cart;
	if (!cart) return null;
	return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}

export async function cartLinesAdd(
	cartId: string,
	lines: { merchandiseId: string; quantity: number }[]
): Promise<ShopifyCartPayload | null> {
	const { data, errors } = await storefrontQuery<{
		cartLinesAdd: {
			cart: {
				id: string;
				checkoutUrl: string;
				totalQuantity: number;
				cost: { totalAmount: { amount: string; currencyCode: string } };
				lines: {
					edges: {
						node: {
							id: string;
							quantity: number;
							merchandise: {
								id: string;
								title: string;
								price: { amount: string; currencyCode: string };
								image?: { url: string } | null;
								product: { title: string };
							};
						};
					}[];
				};
			} | null;
			userErrors: { field: string[]; message: string }[];
		};
	}>({
		query: `
			mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
				cartLinesAdd(cartId: $cartId, lines: $lines) {
					cart {
						id
						checkoutUrl
						totalQuantity
						cost { totalAmount { amount currencyCode } }
						lines(first: 100) {
							edges {
								node {
									id
									quantity
									merchandise {
										... on ProductVariant {
											id
											title
											price { amount currencyCode }
											image { url }
											product { title }
										}
									}
								}
							}
						}
					}
					userErrors { field message }
				}
			}
		`,
		variables: {
			cartId,
			lines: lines.map((l) => ({
				merchandiseId: l.merchandiseId,
				quantity: l.quantity
			}))
		}
	});

	if (errors?.length) {
		console.error('Shopify cartLinesAdd:', errors);
		return null;
	}

	const result = data?.cartLinesAdd;
	if (result?.userErrors?.length) {
		console.error('Shopify cartLinesAdd userErrors:', result.userErrors);
		return null;
	}

	const cart = result?.cart;
	if (!cart) return null;

	const mapped: ShopifyCartLine[] = cart.lines.edges.map(({ node: line }) => {
		const m = line.merchandise;
		return {
			id: line.id,
			quantity: line.quantity,
			title: m.product?.title ?? m.title,
			variantTitle: m.title,
			price: m.price.amount,
			currency: m.price.currencyCode,
			imageUrl: m.image?.url ?? undefined
		};
	});

	return {
		id: cart.id,
		checkoutUrl: cart.checkoutUrl,
		totalQuantity: cart.totalQuantity,
		totalAmount: cart.cost.totalAmount.amount,
		currencyCode: cart.cost.totalAmount.currencyCode,
		lines: mapped
	};
}

export async function cartLinesUpdate(
	cartId: string,
	lines: { id: string; quantity: number }[]
): Promise<ShopifyCartPayload | null> {
	const { data, errors } = await storefrontQuery<{
		cartLinesUpdate: {
			cart: {
				id: string;
				checkoutUrl: string;
				totalQuantity: number;
				cost: { totalAmount: { amount: string; currencyCode: string } };
				lines: {
					edges: {
						node: {
							id: string;
							quantity: number;
							merchandise: {
								id: string;
								title: string;
								price: { amount: string; currencyCode: string };
								image?: { url: string } | null;
								product: { title: string };
							};
						};
					}[];
				};
			} | null;
			userErrors: { field: string[]; message: string }[];
		};
	}>({
		query: `
			mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
				cartLinesUpdate(cartId: $cartId, lines: $lines) {
					cart {
						id
						checkoutUrl
						totalQuantity
						cost { totalAmount { amount currencyCode } }
						lines(first: 100) {
							edges {
								node {
									id
									quantity
									merchandise {
										... on ProductVariant {
											id
											title
											price { amount currencyCode }
											image { url }
											product { title }
										}
									}
								}
							}
						}
					}
					userErrors { field message }
				}
			}
		`,
		variables: {
			cartId,
			lines
		}
	});

	if (errors?.length) {
		console.error('Shopify cartLinesUpdate:', errors);
		return null;
	}

	const result = data?.cartLinesUpdate;
	if (result?.userErrors?.length) {
		console.error('Shopify cartLinesUpdate userErrors:', result.userErrors);
		return null;
	}

	const cart = result?.cart;
	if (!cart) return null;

	const mapped: ShopifyCartLine[] = cart.lines.edges.map(({ node: line }) => {
		const m = line.merchandise;
		return {
			id: line.id,
			quantity: line.quantity,
			title: m.product?.title ?? m.title,
			variantTitle: m.title,
			price: m.price.amount,
			currency: m.price.currencyCode,
			imageUrl: m.image?.url ?? undefined
		};
	});

	return {
		id: cart.id,
		checkoutUrl: cart.checkoutUrl,
		totalQuantity: cart.totalQuantity,
		totalAmount: cart.cost.totalAmount.amount,
		currencyCode: cart.cost.totalAmount.currencyCode,
		lines: mapped
	};
}

export async function cartLinesRemove(cartId: string, lineIds: string[]): Promise<ShopifyCartPayload | null> {
	const { data, errors } = await storefrontQuery<{
		cartLinesRemove: {
			cart: {
				id: string;
				checkoutUrl: string;
				totalQuantity: number;
				cost: { totalAmount: { amount: string; currencyCode: string } };
				lines: {
					edges: {
						node: {
							id: string;
							quantity: number;
							merchandise: {
								id: string;
								title: string;
								price: { amount: string; currencyCode: string };
								image?: { url: string } | null;
								product: { title: string };
							};
						};
					}[];
				};
			} | null;
			userErrors: { field: string[]; message: string }[];
		};
	}>({
		query: `
			mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {
				cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
					cart {
						id
						checkoutUrl
						totalQuantity
						cost { totalAmount { amount currencyCode } }
						lines(first: 100) {
							edges {
								node {
									id
									quantity
									merchandise {
										... on ProductVariant {
											id
											title
											price { amount currencyCode }
											image { url }
											product { title }
										}
									}
								}
							}
						}
					}
					userErrors { field message }
				}
			}
		`,
		variables: { cartId, lineIds }
	});

	if (errors?.length) {
		console.error('Shopify cartLinesRemove:', errors);
		return null;
	}

	const result = data?.cartLinesRemove;
	if (result?.userErrors?.length) {
		console.error('Shopify cartLinesRemove userErrors:', result.userErrors);
		return null;
	}

	const cart = result?.cart;
	if (!cart) return null;

	const mapped: ShopifyCartLine[] = cart.lines.edges.map(({ node: line }) => {
		const m = line.merchandise;
		return {
			id: line.id,
			quantity: line.quantity,
			title: m.product?.title ?? m.title,
			variantTitle: m.title,
			price: m.price.amount,
			currency: m.price.currencyCode,
			imageUrl: m.image?.url ?? undefined
		};
	});

	return {
		id: cart.id,
		checkoutUrl: cart.checkoutUrl,
		totalQuantity: cart.totalQuantity,
		totalAmount: cart.cost.totalAmount.amount,
		currencyCode: cart.cost.totalAmount.currencyCode,
		lines: mapped
	};
}

function toVariantGid(id: string): string {
	const trimmed = id.trim();
	if (trimmed.startsWith('gid://')) return trimmed;
	return `gid://shopify/ProductVariant/${trimmed}`;
}

export { toVariantGid };
