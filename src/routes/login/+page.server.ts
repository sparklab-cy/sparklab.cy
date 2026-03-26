// src/routes/login/+page.server.ts
import { fail, redirect, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { supabase } = locals;

		const form = await request.formData();
		const email = form.get('email') as string;
		const password = form.get('password') as string;

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { error: error.message, email });
		}

		throw redirect(303, '/');
	}
};
