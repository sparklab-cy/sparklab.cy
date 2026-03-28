import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isTeacherOrAdminRole } from '$lib/server/courseAuthoringAccess';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(
			302,
			`/login?redirect=${encodeURIComponent(url.pathname + url.search)}`
		);
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.maybeSingle();

	if (!isTeacherOrAdminRole(profile?.role)) {
		throw redirect(302, '/courses');
	}

	return {};
};
