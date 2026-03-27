import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals, parent }) => {
  const selectedKit = url.searchParams.get('kit');
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

    let userKits: string[] = [];
    if (user) {
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('kit_id')
        .eq('user_id', user.id)
        .eq('permission_type', 'course_access');
      
      userKits = (userPermissions || []).map(p => p.kit_id);
    }

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

    return {
      kits: kits || [],
      officialCourses: officialCourses || [],
      invitedCommunityCourses,
      userCourses,
      selectedKit,
      userKits,
      userRole,
      canCreateCourses: isTeacherOrAdmin && userKits.length > 0,
      error: null
    };

  } catch (error) {
    console.error('Failed to load courses:', error);
    return {
      kits: [],
      officialCourses: [],
      invitedCommunityCourses: [],
      userCourses: [],
      selectedKit,
      userKits: [],
      userRole,
      canCreateCourses: false,
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