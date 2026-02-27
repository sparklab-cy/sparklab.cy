import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { user, supabase } = locals;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { fileId } = params;

	// Fetch the file record
	const { data: lessonFile, error: fetchError } = await supabase
		.from('lesson_files')
		.select('*, lessons(course_id, course_type)')
		.eq('id', fileId)
		.single();

	if (fetchError || !lessonFile) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	// Check permissions
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	const isAdmin = profile?.role === 'admin';
	const lesson = lessonFile.lessons as { course_id: string; course_type: string } | null;

	if (lesson?.course_type === 'custom') {
		const { data: course } = await supabase
			.from('custom_courses')
			.select('creator_id')
			.eq('id', lesson.course_id)
			.single();

		if (!isAdmin && course?.creator_id !== user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
	} else if (!isAdmin) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Remove files from Supabase Storage
	const pathsToRemove: string[] = [lessonFile.storage_path];
	if (lessonFile.compiled_path) {
		pathsToRemove.push(lessonFile.compiled_path);
	}

	const { error: storageError } = await supabase.storage
		.from('lesson-files')
		.remove(pathsToRemove);

	if (storageError) {
		console.error('Storage delete error:', storageError);
		// Continue with DB deletion even if storage cleanup fails
	}

	// Delete the DB row (CASCADE will handle orphan cleanup)
	const { error: dbError } = await supabase.from('lesson_files').delete().eq('id', fileId);

	if (dbError) {
		console.error('DB delete error:', dbError);
		return json({ error: 'Failed to delete file record' }, { status: 500 });
	}

	return json({ success: true });
};
