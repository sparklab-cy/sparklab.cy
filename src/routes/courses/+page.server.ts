import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';

function noticeFromQuery(errorParam: string | null): string | null {
  if (errorParam === 'access_denied') {
    return 'You do not have access to that course.';
  }
  return null;
}

function isPublicPublishedCourse(c: { is_public?: boolean | null; is_published?: boolean | null }): boolean {
  return c.is_public === true && c.is_published === true;
}

export const load: PageServerLoad = async ({ url, locals, parent }) => {
  const selectedKit = url.searchParams.get('kit');
  const urlNotice = noticeFromQuery(url.searchParams.get('error'));
  const { user, supabase } = locals;

  const parentData = await parent();
  const userRole: string = parentData.profile?.role ?? 'user';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';
  
  try {
    const { data: kits, error: kitsError } = await supabase
      .from('kits')
      .select('*')
      .order('level', { ascending: true });
    if (kitsError) throw kitsError;

    /** Kit IDs the user may use (course_access and/or legacy `user_kits` rows). */
    let userKits: string[] = [];
    if (user) {
      const kitIdSet = new Set<string>();
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('kit_id')
        .eq('user_id', user.id)
        .eq('permission_type', 'course_access');
      for (const p of userPermissions || []) kitIdSet.add(p.kit_id);

      const { data: userKitRows } = await supabase
        .from('user_kits')
        .select('kit_id')
        .eq('user_id', user.id);
      for (const r of userKitRows || []) kitIdSet.add(r.kit_id);

      userKits = [...kitIdSet];
    }
    console.log('userKits', userKits);

    let officialCourses: any[] = [];
    
    if (selectedKit) {
      const { data, error } = await supabase
        .from('official_courses')
        .select('*')
        .eq('is_published', true)
        .eq('kit_id', selectedKit)
        .order('level', { ascending: true });
      
      if (error) throw error;
      officialCourses = data || [];
    } else if (userKits.length > 0) {
      const { data, error } = await supabase
        .from('official_courses')
        .select('*')
        .eq('is_published', true)
        .in('kit_id', userKits)
        .order('level', { ascending: true });
      
      if (error) throw error;
      officialCourses = data || [];
    }

    let userCourses: any[] = [];
    if (user && isTeacherOrAdmin && userKits.length > 0) {
      const { data } = await supabase
        .from('custom_courses')
        .select('*, kits:kit_id(name, theme, level)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      userCourses = data ?? [];
    }

    let invitedCommunityCourses: any[] = [];
    if (user) {
      const { data: grantRows, error: grantErr } = await supabase
        .from('course_access_grants')
        .select(
          `
          course_id,
          custom_courses (
            id,
            title,
            description,
            kit_id,
            is_published,
            creator_id,
            kits:kit_id ( name, theme, level )
          )
        `
        )
        .eq('user_id', user.id);

      if (!grantErr && grantRows?.length) {
        const seen = new Set<string>();
        for (const r of grantRows as { custom_courses: any }[]) {
          const c = r.custom_courses;
          if (!c?.id || seen.has(c.id)) continue;
          if (c.creator_id === user.id) continue;
          seen.add(c.id);
          invitedCommunityCourses.push(c);
        }
      }
    }

    /**
     * Public catalog: custom courses that are public + published, and whose kit is in the user's
     * allowed set. Prefer service-role so we read the full `custom_courses` set and enforce kit
     * access in code (avoids RLS hiding rows for non-admins). Without service role, query with
     * the user client and the same filters in SQL (RLS must allow public published reads).
     */
    let publicCommunityCourses: any[] = [];
    if (user && userKits.length > 0) {
      const kitIdsForCatalog =
        selectedKit && userKits.includes(selectedKit) ? [selectedKit] : userKits;
      const allowedKitIds = new Set(kitIdsForCatalog);

      const inviteIds = new Set(invitedCommunityCourses.map((c) => c.id));
      const admin = getSupabaseAdmin();

      let pubRows: any[] = [];

      if (admin) {
        let allRows: any[] | null = null;
        const withEmbed = await admin
          .from('custom_courses')
          .select('*, kits:kit_id(name, theme, level)')
          .order('created_at', { ascending: false });

        if (withEmbed.error) {
          console.error('courses: admin custom_courses (with kits embed) failed:', withEmbed.error);
          const plain = await admin
            .from('custom_courses')
            .select('*')
            .order('created_at', { ascending: false });
          if (plain.error) {
            console.error('courses: admin custom_courses (plain) failed:', plain.error);
          } else {
            allRows = plain.data;
          }
        } else {
          allRows = withEmbed.data;
        }

        pubRows = (allRows ?? []).filter(
          (c) =>
            c?.id &&
            isPublicPublishedCourse(c) &&
            typeof c.kit_id === 'string' &&
            allowedKitIds.has(c.kit_id)
        );
      } else {
        const withEmbed = await supabase
          .from('custom_courses')
          .select('*, kits:kit_id(name, theme, level)')
          .eq('is_public', true)
          .eq('is_published', true)
          .in('kit_id', kitIdsForCatalog)
          .order('created_at', { ascending: false });

        if (withEmbed.error) {
          console.error('courses: user custom_courses catalog (with embed) failed:', withEmbed.error);
          const plain = await supabase
            .from('custom_courses')
            .select('*')
            .eq('is_public', true)
            .eq('is_published', true)
            .in('kit_id', kitIdsForCatalog)
            .order('created_at', { ascending: false });
          if (plain.error) {
            console.error('courses: user custom_courses catalog (plain) failed:', plain.error);
          } else {
            pubRows = plain.data ?? [];
          }
        } else {
          pubRows = withEmbed.data ?? [];
        }
      }

      for (const c of pubRows) {
        if (!c?.id) continue;
        if (c.creator_id === user.id) continue;
        if (inviteIds.has(c.id)) continue;
        publicCommunityCourses.push(c);
      }
    }

    const seenLibrary = new Set<string>();
    const libraryCourses: any[] = [];
    for (const c of publicCommunityCourses) {
      if (!c?.id || seenLibrary.has(c.id)) continue;
      seenLibrary.add(c.id);
      libraryCourses.push(c);
    }
    for (const c of invitedCommunityCourses) {
      if (!c?.id || seenLibrary.has(c.id)) continue;
      seenLibrary.add(c.id);
      libraryCourses.push(c);
    }
    for (const c of officialCourses || []) {
      if (!c?.id || seenLibrary.has(c.id)) continue;
      seenLibrary.add(c.id);
      libraryCourses.push(c);
    }

    return {
      kits: kits || [],
      officialCourses: officialCourses || [],
      invitedCommunityCourses,
      publicCommunityCourses,
      libraryCourses,
      userCourses,
      selectedKit,
      userKits,
      userRole,
      canCreateCourses: isTeacherOrAdmin && userKits.length > 0,
      urlNotice,
      error: null
    };

  } catch (error) {
    console.error('Failed to load courses:', error);
    return {
      kits: [],
      officialCourses: [],
      invitedCommunityCourses: [],
      publicCommunityCourses: [],
      libraryCourses: [],
      userCourses: [],
      selectedKit,
      userKits: [],
      userRole,
      canCreateCourses: false,
      urlNotice,
      error: 'Failed to load courses'
    };
  }
};

export const actions: Actions = {
  createCourse: async ({ request, locals }) => {
    const { user, supabase } = locals;
    if (!user) return { success: false, error: 'Please log in' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'user';
    if (role !== 'teacher' && role !== 'admin') {
      return { success: false, error: 'Only teachers and admins can create courses' };
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const kitId = formData.get('kitId') as string;

    const { data: permission } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('kit_id', kitId)
      .eq('permission_type', 'course_access')
      .single();

    if (!permission) {
      return { success: false, error: 'You do not have access to the selected kit' };
    }

    const { data: course, error: err } = await supabase
      .from('custom_courses')
      .insert({
        creator_id: user.id,
        kit_id: kitId,
        title,
        description,
        price: 0,
        is_public: false,
        is_published: false
      })
      .select()
      .single();

    if (err) return { success: false, error: err.message };
    throw redirect(303, `/create-course/${course.id}`);
  }
}; 