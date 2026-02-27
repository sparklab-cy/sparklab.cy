import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const { user, supabase } = locals;
	const { token } = params;

	if (!user) {
		throw redirect(302, `/login?redirect=/courses/join/${token}`);
	}

	// Look up the course by invite token
	const { data: course, error } = await supabase
		.from('custom_courses')
		.select('id, title, creator_id, is_published')
		.eq('invite_token', token)
		.single();

	if (error || !course) {
		throw redirect(302, '/courses?error=invalid_invite');
	}

	// Don't grant if the user is already the creator
	if (course.creator_id === user.id) {
		throw redirect(302, `/create-course/${course.id}`);
	}

	const now = new Date().toISOString();

	// Upsert the access grant and mark as joined
	const { data: existingGrant } = await supabase
		.from('course_access_grants')
		.select('id, joined_at')
		.eq('course_id', course.id)
		.eq('user_id', user.id)
		.single();

	if (existingGrant) {
		// Already in the table — just record joined_at if not already set
		if (!existingGrant.joined_at) {
			await supabase
				.from('course_access_grants')
				.update({ joined_at: now })
				.eq('id', existingGrant.id);
		}
	} else {
		await supabase.from('course_access_grants').insert({
			course_id: course.id,
			user_id: user.id,
			granted_by: course.creator_id,
			joined_at: now
		});
	}

	throw redirect(302, `/courses/community/${course.id}`);
};
