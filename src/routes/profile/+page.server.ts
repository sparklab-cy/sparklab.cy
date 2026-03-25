import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, supabase } = locals;
  
  if (!user) {
    throw redirect(302, '/login?redirect=/profile');
  }
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: userKitsRaw } = await supabase
      .from('user_kits')
      .select('kit_id, kits ( id, name, level, theme, image_url, description )')
      .eq('user_id', user.id);

    const userKits = (userKitsRaw || [])
      .map((row: any) => (Array.isArray(row.kits) ? row.kits[0] : row.kits))
      .filter(Boolean);

    const { data: userProgress } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id);

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const progress = userProgress || [];

    return {
      user,
      profile: profile || { role: 'user', full_name: null, bio: null },
      userKits,
      userProgress: progress,
      recentOrders: recentOrders || [],
      error: null
    };
  } catch (error) {
    console.error('Profile load error:', error);
    return {
      user,
      profile: { role: 'user', full_name: null, bio: null },
      userKits: [],
      userProgress: [],
      recentOrders: [],
      error: 'Failed to load profile data'
    };
  }
};

export const actions: Actions = {
  updateProfile: async ({ request, locals }) => {
    const { user, supabase } = locals;
    if (!user) return fail(401, { error: 'Not logged in' });

    const formData = await request.formData();
    const fullName = (formData.get('fullName') as string)?.trim() || '';
    const bio = (formData.get('bio') as string)?.trim() || '';

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio })
      .eq('id', user.id);

    if (error) {
      return fail(500, { error: 'Failed to update profile' });
    }

    return { success: true };
  }
};
