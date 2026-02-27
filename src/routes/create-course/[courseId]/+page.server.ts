import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const { courseId } = params;
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(302, '/login');
	}

	// Load the course and verify creator ownership
	const { data: course, error: courseError } = await supabase
		.from('custom_courses')
		.select('*')
		.eq('id', courseId)
		.single();

	if (courseError || !course) {
		throw error(404, 'Course not found');
	}

	if (course.creator_id !== user.id) {
		throw redirect(302, '/courses');
	}

	// Load lessons ordered by index
	const { data: lessons } = await supabase
		.from('lessons')
		.select('*')
		.eq('course_id', courseId)
		.eq('course_type', 'custom')
		.order('order_index', { ascending: true });

	// Load all lesson files for this course's lessons
	const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
	let lessonFilesMap: Record<string, any[]> = {};

	if (lessonIds.length > 0) {
		const { data: allFiles } = await supabase
			.from('lesson_files')
			.select('*')
			.in('lesson_id', lessonIds)
			.order('tab_order', { ascending: true });

		for (const file of allFiles ?? []) {
			if (!lessonFilesMap[file.lesson_id]) lessonFilesMap[file.lesson_id] = [];
			lessonFilesMap[file.lesson_id].push(file);
		}
	}

	// Load access grants with grantee profile info (includes joined_at)
	const { data: accessGrants } = await supabase
		.from('course_access_grants')
		.select('*, profiles:user_id(id, full_name, email)')
		.eq('course_id', courseId)
		.order('created_at', { ascending: true });

	// Load per-user lesson visibility deny-list
	let hiddenPairs: Array<{ lesson_id: string; user_id: string }> = [];
	if (lessonIds.length > 0) {
		const { data: denies } = await supabase
			.from('lesson_user_visibility')
			.select('lesson_id, user_id')
			.in('lesson_id', lessonIds)
			.eq('is_visible', false);
		hiddenPairs = denies ?? [];
	}

	return {
		course,
		lessons: lessons ?? [],
		lessonFilesMap,
		accessGrants: accessGrants ?? [],
		hiddenPairs,
		origin: url.origin
	};
};

export const actions: Actions = {
	createLesson: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const orderIndex = parseInt((formData.get('order_index') as string) ?? '1', 10);
		const estimatedDuration = formData.get('estimated_duration')
			? parseInt(formData.get('estimated_duration') as string, 10)
			: null;

		// Verify ownership
		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		const { data: lesson, error: err } = await supabase
			.from('lessons')
			.insert({
				course_id: params.courseId,
				course_type: 'custom',
				title,
				content_type: 'text',
				order_index: orderIndex,
				estimated_duration: estimatedDuration,
				is_published: false
			})
			.select()
			.single();

		if (err) return { success: false, error: err.message };
		return { success: true, lesson };
	},

	deleteLesson: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const lessonId = formData.get('lessonId') as string;

		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		const { error: err } = await supabase.from('lessons').delete().eq('id', lessonId);
		if (err) return { success: false, error: err.message };
		return { success: true };
	},

	publishLesson: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const lessonId = formData.get('lessonId') as string;

		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		const { error: err } = await supabase
			.from('lessons')
			.update({ is_published: true })
			.eq('id', lessonId);

		if (err) return { success: false, error: err.message };
		return { success: true };
	},

	unpublishLesson: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const lessonId = formData.get('lessonId') as string;

		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		const { error: err } = await supabase
			.from('lessons')
			.update({ is_published: false })
			.eq('id', lessonId);

		if (err) return { success: false, error: err.message };
		return { success: true };
	},

	grantAccess: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();

		if (!email) return { success: false, error: 'Email is required' };

		// Verify ownership
		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		// Look up the target user by email via auth.users (available via supabase admin)
		// Fall back to profiles table which stores email
		const { data: targetProfile } = await supabase
			.from('profiles')
			.select('id, full_name, email')
			.eq('email', email)
			.single();

		if (!targetProfile) {
			return { success: false, error: 'No account found with that email address' };
		}

		if (targetProfile.id === user.id) {
			return { success: false, error: 'You cannot grant access to yourself' };
		}

		const { error: err } = await supabase.from('course_access_grants').upsert(
			{
				course_id: params.courseId,
				user_id: targetProfile.id,
				granted_by: user.id
			},
			{ onConflict: 'course_id,user_id', ignoreDuplicates: true }
		);

		if (err) return { success: false, error: err.message };
		return { success: true, message: `Access granted to ${targetProfile.full_name ?? email}` };
	},

	revokeAccess: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const grantId = formData.get('grantId') as string;

		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		const { error: err } = await supabase
			.from('course_access_grants')
			.delete()
			.eq('id', grantId);

		if (err) return { success: false, error: err.message };
		return { success: true };
	},

	regenerateInviteToken: async ({ params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		// Generate a new random token
		const newToken = crypto.randomUUID().replace(/-/g, '');

		const { error: err } = await supabase
			.from('custom_courses')
			.update({ invite_token: newToken })
			.eq('id', params.courseId);

		if (err) return { success: false, error: err.message };
		return { success: true, invite_token: newToken };
	},

	toggleLessonVisibility: async ({ request, params, locals }) => {
		const { user, supabase } = locals;
		if (!user) return { success: false, error: 'Unauthorized' };

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const lessonId = formData.get('lessonId') as string;
		const isVisible = formData.get('isVisible') === 'true';

		// Verify creator
		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', params.courseId)
			.single();

		if (course?.creator_id !== user.id) return { success: false, error: 'Forbidden' };

		if (isVisible) {
			// Remove the deny record — user can now see this lesson
			await supabase
				.from('lesson_user_visibility')
				.delete()
				.eq('lesson_id', lessonId)
				.eq('user_id', userId);
		} else {
			// Upsert a deny record
			await supabase
				.from('lesson_user_visibility')
				.upsert({ lesson_id: lessonId, user_id: userId, is_visible: false }, {
					onConflict: 'lesson_id,user_id'
				});
		}

		return { success: true };
	}
};
