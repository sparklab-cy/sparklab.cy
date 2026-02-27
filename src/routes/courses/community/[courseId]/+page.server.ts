import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { courseId } = params;
  const { user, supabase } = locals;

  try {
    // Require login first (needed to check access grants)
    if (!user) {
      throw redirect(302, `/login?redirect=/courses/community/${courseId}`);
    }

    // Load community course — RLS already filters based on user's grants,
    // but we check is_published too. Creators can always see their own course.
    const { data: course, error: courseError } = await supabase
      .from('custom_courses')
      .select(`
        *,
        creator:profiles(full_name, email)
      `)
      .eq('id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      throw redirect(302, '/courses');
    }

    // Check access: public course OR user has an explicit access grant OR user is creator
    const isCreator = course.creator_id === user.id;
    let hasAccess = isCreator || course.is_public;

    if (!hasAccess) {
      const { data: grant } = await supabase
        .from('course_access_grants')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();
      hasAccess = !!grant;
    }

    if (!hasAccess) {
      throw redirect(302, '/courses?error=access_denied');
    }

    // Check if user has access to the kit (still required to take the course)
    if (!isCreator) {
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('kit_id', course.kit_id)
        .eq('permission_type', 'course_access')
        .single();

      if (!userPermissions) {
        throw redirect(302, `/shop/${course.kit_id}`);
      }
    }

    // Mark joined_at if this is the first time the user is accessing this course
    if (!isCreator) {
      const { data: grant } = await supabase
        .from('course_access_grants')
        .select('id, joined_at')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (grant && !grant.joined_at) {
        await supabase
          .from('course_access_grants')
          .update({ joined_at: new Date().toISOString() })
          .eq('id', grant.id);
      }
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

    // Load user progress
    const { data: userProgress } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('course_type', 'custom');

    return {
      course,
      lessons,
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