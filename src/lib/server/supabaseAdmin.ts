import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';

/** Service-role client (bypasses RLS). Only call from server code. */
export function getSupabaseAdmin(): SupabaseClient | null {
	const key =
		PRIVATE_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
		env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
		env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY?.trim();
	if (!key || !PUBLIC_SUPABASE_URL?.trim()) return null;
	return createClient(PUBLIC_SUPABASE_URL, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

/** True when a service-role key is available (for diagnostics; no secrets returned). */
export function isSupabaseAdminConfigured(): boolean {
	return Boolean(getSupabaseAdmin());
}
