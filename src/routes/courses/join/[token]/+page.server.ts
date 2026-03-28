import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = locals;
	const { token } = params;

	if (!user) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(`/courses/join/${token}`)}`);
	}

	const admin = getSupabaseAdmin();
	if (!admin) {
		console.error('courses/join: PRIVATE_SUPABASE_SERVICE_ROLE_KEY missing');
		throw redirect(302, '/courses?error=invite_config');
	}

	// Token lookup must bypass RLS (invitees cannot read custom_courses until they have a grant)
	const { data: course, error: courseErr } = await admin
		.from('custom_courses')
		.select('id, title, creator_id')
		.eq('invite_token', token)
		.maybeSingle();

	if (courseErr || !course) {
		throw redirect(302, '/courses?error=invalid_invite');
	}

	// Invite links work for draft courses too — access is gated by the secret token + grant.

	if (course.creator_id === user.id) {
		throw redirect(302, `/create-course/${course.id}`);
	}

	const now = new Date().toISOString();

	const { data: existing } = await admin
		.from('course_access_grants')
		.select('id, joined_at')
		.eq('course_id', course.id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (existing) {
		if (!existing.joined_at) {
			await admin.from('course_access_grants').update({ joined_at: now }).eq('id', existing.id);
		}
	} else {
		const { error: insertErr } = await admin.from('course_access_grants').insert({
			course_id: course.id,
			user_id: user.id,
			granted_by: course.creator_id,
			joined_at: now
		});
		if (insertErr) {
			console.error('courses/join: insert grant failed:', insertErr);
			throw redirect(302, '/courses?error=invite_failed');
		}
	}

	throw redirect(302, `/courses/${course.id}`);
};
