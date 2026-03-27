/// <reference types="@sveltejs/kit" />

declare module '$env/static/public' {
	export const PUBLIC_SHOPIFY_STORE_DOMAIN: string;
	export const PUBLIC_SHOPIFY_STOREFRONT_TOKEN: string;
	export const PUBLIC_SHOPIFY_API_VERSION: string | undefined;
	export const PUBLIC_SHOPIFY_KITS_COLLECTION_HANDLE: string | undefined;
}
