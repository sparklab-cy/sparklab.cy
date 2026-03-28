import type { PageServerLoad } from './$types';
import { redirect, isRedirect } from '@sveltejs/kit';
import type { LessonFile } from '$lib/types/courses';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

function buildLessonFilesMap(
	allFiles: { lesson_id: string }[] | null
): Record<string, LessonFile[]> {
	const lessonFilesMap: Record<string, LessonFile[]> = {};
	for (const file of allFiles ?? []) {
		const f = file as LessonFile;
		if (!lessonFilesMap[f.lesson_id]) lessonFilesMap[f.lesson_id] = [];
		lessonFilesMap[f.lesson_id].push(f);
	}
	return lessonFilesMap;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { courseId } = params;
	const { user, supabase } = locals;

	if (!user) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(`/courses/${courseId}`)}`);
	}

	try {
		const { data: customCourse, error: customErr } = await supabase
			.from('custom_courses')
			.select('*')
			.eq('id', courseId)
			.maybeSingle();

		if (customErr) {
			console.error('custom_courses lookup:', customErr);
		}

		if (customCourse) {
			const admin = getSupabaseAdmin();
			let creator: { full_name: string | null } = { full_name: null };
			if (admin && customCourse.creator_id) {
				const { data: prof } = await admin
					.from('profiles')
					.select('full_name')
					.eq('id', customCourse.creator_id)
					.maybeSingle();
				creator = { full_name: prof?.full_name ?? null };
			}

			const courseWithCreator = { ...customCourse, creator };
			const isCreator = customCourse.creator_id === user.id;

			const { data: grantRow } = await supabase
				.from('course_access_grants')
				.select('id, joined_at')
				.eq('course_id', courseId)
				.eq('user_id', user.id)
				.maybeSingle();

			const hasGrant = !!grantRow;

			const hasAccess =
				isCreator ||
				hasGrant ||
				(customCourse.is_public === true && customCourse.is_published === true);

			if (!hasAccess) {
				throw redirect(302, '/courses?error=access_denied');
			}

			if (!isCreator && customCourse.is_public && customCourse.is_published) {
				const { data: userPermissions } = await supabase
					.from('user_permissions')
					.select('id')
					.eq('user_id', user.id)
					.eq('kit_id', customCourse.kit_id)
					.eq('permission_type', 'course_access')
					.maybeSingle();

				if (!userPermissions) {
					throw redirect(302, `/shop`);
				}
			}

			if (!isCreator && grantRow && !grantRow.joined_at) {
				await supabase
					.from('course_access_grants')
					.update({ joined_at: new Date().toISOString() })
					.eq('id', grantRow.id);
			}

			const { data: allLessons, error: lessonsError } = await supabase
				.from('lessons')
				.select('*')
				.eq('course_id', courseId)
				.eq('course_type', 'custom')
				.eq('is_published', true)
				.order('order_index', { ascending: true });

			if (lessonsError) throw lessonsError;

			let lessons = allLessons ?? [];
			if (lessons.length > 0 && !isCreator) {
				const { data: denies } = await supabase
					.from('lesson_user_visibility')
					.select('lesson_id')
					.eq('user_id', user.id)
					.in(
						'lesson_id',
						lessons.map((l: { id: string }) => l.id)
					)
					.eq('is_visible', false);

				const hiddenIds = new Set((denies ?? []).map((d: { lesson_id: string }) => d.lesson_id));
				lessons = lessons.filter((l: { id: string }) => !hiddenIds.has(l.id));
			}

			const lessonIds = lessons.map((l: { id: string }) => l.id);
			let lessonFilesMap: Record<string, LessonFile[]> = {};
			if (lessonIds.length > 0) {
				const { data: allFiles } = await supabase
					.from('lesson_files')
					.select('*')
					.in('lesson_id', lessonIds)
					.order('tab_order', { ascending: true });
				lessonFilesMap = buildLessonFilesMap(allFiles);
			}

			const { data: userProgress } = await supabase
				.from('user_lesson_progress')
				.select('*')
				.eq('user_id', user.id)
				.eq('course_id', courseId)
				.eq('course_type', 'custom');

			return {
				courseKind: 'custom' as const,
				course: courseWithCreator,
				lessons,
				lessonFilesMap,
				userProgress: userProgress || [],
				error: null as string | null
			};
		}

		const { data: officialCourse, error: officialErr } = await supabase
			.from('official_courses')
			.select('*')
			.eq('id', courseId)
			.maybeSingle();

		if (officialErr) {
			console.error('official_courses lookup:', officialErr);
		}

		if (!officialCourse) {
			throw redirect(302, '/courses');
		}

		const { data: userPermissions } = await supabase
			.from('user_permissions')
			.select('*')
			.eq('user_id', user.id)
			.eq('kit_id', officialCourse.kit_id)
			.eq('permission_type', 'course_access')
			.maybeSingle();

		if (!userPermissions) {
			return {
				courseKind: 'official' as const,
				course: null,
				lessons: [],
				lessonFilesMap: {} as Record<string, LessonFile[]>,
				userProgress: [],
				error: 'You need to purchase the required kit to access this course'
			};
		}

		const { data: lessons, error: lessonsError } = await supabase
			.from('lessons')
			.select('*')
			.eq('course_id', courseId)
			.eq('course_type', 'official')
			.eq('is_published', true)
			.order('order_index', { ascending: true });

		if (lessonsError) throw lessonsError;

		const lessonList = lessons ?? [];
		const lessonIds = lessonList.map((l: { id: string }) => l.id);
		let lessonFilesMap: Record<string, LessonFile[]> = {};
		if (lessonIds.length > 0) {
			const { data: allFiles } = await supabase
				.from('lesson_files')
				.select('*')
				.in('lesson_id', lessonIds)
				.order('tab_order', { ascending: true });
			lessonFilesMap = buildLessonFilesMap(allFiles);
		}

		const { data: progressData } = await supabase
			.from('user_lesson_progress')
			.select('*')
			.eq('user_id', user.id)
			.eq('course_id', courseId)
			.eq('course_type', 'official');

		return {
			courseKind: 'official' as const,
			course: officialCourse,
			lessons: lessonList,
			lessonFilesMap,
			userProgress: progressData || [],
			error: null as string | null
		};
	} catch (e) {
		if (isRedirect(e)) throw e;
		console.error('Failed to load course:', e);
		throw redirect(302, '/courses');
	}
};
