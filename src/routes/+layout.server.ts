import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { user } = await locals.safeGetSession();
    
    let profile = null;
    if (user) {
        const { data, error } = await locals.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        } else {
            profile = data;
        }
    }

    const isAdmin = profile?.role === 'admin';

	return {
        user,
        profile,
        isAdmin,
    }
};
