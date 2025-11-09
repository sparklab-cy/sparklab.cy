// src/routes/auth/callback/+server.ts
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	const { supabase } = locals;

	if (!code) {
		throw redirect(303, '/login');
	}

	// ⬇️ This is the missing step — exchange the code for a session
	// The Supabase SSR client automatically handles cookie management,
	// so we don't need to manually set cookies here
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		console.error('OAuth login failed:', error?.message);
		throw redirect(303, '/login?error=auth_failed');
	}

	throw redirect(303, next); // redirect to homepage or originally intended page
};
