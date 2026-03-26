// src/routes/auth/callback/+server.ts
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/';

	const { supabase } = locals;

	if (!code) {
		throw redirect(303, '/login');
	}

	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		console.error('OAuth login failed:', error?.message);
		throw redirect(303, '/login?error=auth_failed');
	}

	throw redirect(303, safeNext);
};
