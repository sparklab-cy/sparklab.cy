// src/routes/auth/google/+server.ts
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { PUBLIC_SITE_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase } = locals;

	// Use environment variable or construct from request URL
	const redirectUrl = PUBLIC_SITE_URL 
		? `${PUBLIC_SITE_URL}/auth/callback`
		: `${url.origin}/auth/callback`;

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
