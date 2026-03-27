import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { LessonFile } from '$lib/types/courses';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { courseId } = params;
  const { user, supabase } = locals;

  try {
    // Require login first (needed to check access grants)
    if (!user) {
      throw redirect(302, `/login?redirect=/courses/community/${courseId}`);
    }

    // Load course (draft + invite-only rows visible via RLS to creator or grant holders)
    const { data: course, error: courseError } = await supabase
      .from('custom_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw redirect(302, '/courses');
    }

    const admin = getSupabaseAdmin();
    let creator: { full_name: string | null } = { full_name: null };
    if (admin && course.creator_id) {
      const { data: prof } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', course.creator_id)
        .maybeSingle();
      creator = { full_name: prof?.full_name ?? null };
    }

    const courseWithCreator = { ...course, creator };

    const isCreator = course.creator_id === user.id;

    const { data: grantRow } = await supabase
      .from('course_access_grants')
      .select('id, joined_at')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .maybeSingle();

    const hasGrant = !!grantRow;

    // Published public catalog OR creator OR invited user (draft OK for invitees)
    const hasAccess =
      isCreator ||
      hasGrant ||
      (course.is_public === true && course.is_published === true);

    if (!hasAccess) {
      throw redirect(302, '/courses?error=access_denied');
    }

    // Kit required only for published public catalog courses (not for invite-only access)
    if (!isCreator && course.is_public && course.is_published) {
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('kit_id', course.kit_id)
        .eq('permission_type', 'course_access')
        .maybeSingle();

      if (!userPermissions) {
        throw redirect(302, `/shop`);
      }
    }

    // Mark joined_at if this is the first time the user is accessing this course
    if (!isCreator && grantRow && !grantRow.joined_at) {
      await supabase
        .from('course_access_grants')
        .update({ joined_at: new Date().toISOString() })
        .eq('id', grantRow.id);
    }

    // Load lessons — filter by per-user visibility deny-list
    const { data: allLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('course_type', 'custom')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (lessonsError) throw lessonsError;

    // Filter out lessons hidden for this specific user (deny-list)
    let lessons = allLessons ?? [];
    if (lessons.length > 0 && !isCreator) {
      const { data: denies } = await supabase
        .from('lesson_user_visibility')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessons.map((l: { id: string }) => l.id))
        .eq('is_visible', false);

      const hiddenIds = new Set((denies ?? []).map((d: { lesson_id: string }) => d.lesson_id));
      lessons = lessons.filter((l: { id: string }) => !hiddenIds.has(l.id));
    }

    const lessonIds = lessons.map((l: { id: string }) => l.id);
    const lessonFilesMap: Record<string, LessonFile[]> = {};
    if (lessonIds.length > 0) {
      const { data: allFiles } = await supabase
        .from('lesson_files')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('tab_order', { ascending: true });

      for (const file of allFiles ?? []) {
        const f = file as LessonFile;
        if (!lessonFilesMap[f.lesson_id]) lessonFilesMap[f.lesson_id] = [];
        lessonFilesMap[f.lesson_id].push(f);
      }
    }

    // Load user progress
    const { data: userProgress } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('course_type', 'custom');

    return {
      course: courseWithCreator,
      lessons,
      lessonFilesMap,
      userProgress: userProgress || [],
      error: null
    };

  } catch (error) {
    console.error('Failed to load community course:', error);
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    throw redirect(302, '/shop');
  }
}; 