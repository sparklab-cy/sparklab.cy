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

/**
 * Resolve auth user id by email (RPC `get_user_id_by_email`, service_role only).
 * Returns null if admin client is missing, RPC errors, or no user found.
 */
export async function getAuthUserIdByEmail(email: string): Promise<string | null> {
	const admin = getSupabaseAdmin();
	const trimmed = email?.trim().toLowerCase();
	if (!admin || !trimmed) return null;

	const { data, error } = await admin.rpc('get_user_id_by_email', {
		lookup_email: trimmed
	});

	if (error) {
		console.error('get_user_id_by_email RPC:', error);
		return null;
	}

	if (data == null) return null;
	return typeof data === 'string' ? data : String(data);
}
