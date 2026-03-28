import type { SupabaseClient } from '@supabase/supabase-js';

export function isTeacherOrAdminRole(role: string | null | undefined): boolean {
	return role === 'teacher' || role === 'admin';
}

/** Server-side check for create-course pages and related form actions. */
export async function getAuthoringForbiddenMessage(
	supabase: SupabaseClient,
	userId: string
): Promise<string | null> {
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', userId)
		.maybeSingle();

	if (!isTeacherOrAdminRole(profile?.role)) {
		return 'Only teachers and admins can manage courses';
	}
	return null;
}
