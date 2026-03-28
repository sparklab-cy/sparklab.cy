// src/routes/auth/google/+server.ts
import { redirect, type RequestHandler } from '@sveltejs/kit';

/**
 * OAuth redirect must match the origin the user actually used (e.g. https://byteblocks.com.cy).
 * Do not rely on PUBLIC_SITE_URL here: it is often set to http://localhost:5173 in .env and gets
 * baked into production builds, which makes Supabase send users back to localhost after Google.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase } = locals;

	const redirectUrl = `${url.origin}/auth/callback`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: redirectUrl
		}
	});

	if (error || !data?.url) {
		throw redirect(303, '/login');
	}
	
	throw redirect(303, data.url);
};
