import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
  const selectedKit = url.searchParams.get('kit');
  const { user, supabase } = locals;
  
  try {
    // Load kits
    const { data: kits, error: kitsError } = await supabase
      .from('kits')
      .select('*')
      .order('level', { ascending: true });
    
    if (kitsError) throw kitsError;

    // Load user's purchased kits if logged in
    let userKits: string[] = [];
    if (user) {
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('kit_id')
        .eq('user_id', user.id)
        .eq('permission_type', 'course_access');
      
      userKits = (userPermissions || []).map(p => p.kit_id);
    }

    // Load official courses (only for kits user has access to)
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
      // Filter to only show courses for kits the user owns
      const { data, error } = await supabase
        .from('official_courses')
        .select('*')
        .eq('is_published', true)
        .in('kit_id', userKits)
        .order('level', { ascending: true });
      
      if (error) throw error;
      officialCourses = data || [];
    } else {
      // If user has no kits, return empty array
      officialCourses = [];
    }

    // Load custom courses (only for kits user has access to)
    let customCourses: any[] = [];
    
    if (selectedKit) {
      const { data, error } = await supabase
        .from('custom_courses')
        .select(`*`)
        .eq('is_published', true)
        .eq('is_public', true)
        .eq('kit_id', selectedKit)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      customCourses = data || [];
    } else if (userKits.length > 0) {
      // Filter to only show courses for kits the user owns
      const { data, error } = await supabase
        .from('custom_courses')
        .select(`*`)
        .eq('is_published', true)
        .eq('is_public', true)
        .in('kit_id', userKits)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      customCourses = data || [];
    } else {
      // If user has no kits, return empty array
      customCourses = [];
    }

    // Load the user's own courses (as creator) when they own kits
    let userCourses: any[] = [];
    if (user && userKits.length > 0) {
      const { data } = await supabase
        .from('custom_courses')
        .select('*, kits:kit_id(name, theme, level)')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      userCourses = data ?? [];
    }

    return {
      kits: kits || [],
      officialCourses: officialCourses || [],
      customCourses: customCourses || [],
      userCourses,
      selectedKit,
      userKits,
      canCreateCourses: userKits.length > 0,
      error: null
    };

  } catch (error) {
    console.error('Failed to load courses:', error);
    return {
      kits: [],
      officialCourses: [],
      customCourses: [],
      userCourses: [],
      selectedKit,
      userKits: [],
      canCreateCourses: false,
      error: 'Failed to load courses'
    };
  }
};

export const actions: Actions = {
  createCourse: async ({ request, locals }) => {
    const { user, supabase } = locals;
    if (!user) return { success: false, error: 'Please log in' };

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const kitId = formData.get('kitId') as string;
    const isPublic = formData.get('isPublic') === 'true';

    // Verify the user has access to this kit
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
        is_public: isPublic,
        is_published: false
      })
      .select()
      .single();

    if (err) return { success: false, error: err.message };
    throw redirect(303, `/create-course/${course.id}`);
  }
}; 