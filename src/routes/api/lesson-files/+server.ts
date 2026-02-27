import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { compile } from 'svelte/compiler';

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov', 'avi']);

function getFileType(filename: string): 'markdown' | 'video' | 'svelte' | null {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	if (ext === 'md') return 'markdown';
	if (ext === 'svelte') return 'svelte';
	if (VIDEO_EXTENSIONS.has(ext)) return 'video';
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user, supabase } = locals;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ error: 'Invalid form data' }, { status: 400 });
	}

	const lessonId = formData.get('lesson_id') as string;
	const tabOrder = parseInt((formData.get('tab_order') as string) ?? '0', 10);
	const file = formData.get('file') as File | null;

	if (!lessonId || !file) {
		return json({ error: 'lesson_id and file are required' }, { status: 400 });
	}

	const fileType = getFileType(file.name);
	if (!fileType) {
		return json(
			{ error: 'Unsupported file type. Allowed: .md, .svelte, .mp4, .webm, .ogg, .mov, .avi' },
			{ status: 400 }
		);
	}

	// Verify the user has permission to upload to this lesson
	const { data: lesson, error: lessonError } = await supabase
		.from('lessons')
		.select('id, course_id, course_type')
		.eq('id', lessonId)
		.single();

	if (lessonError || !lesson) {
		return json({ error: 'Lesson not found' }, { status: 404 });
	}

	// Check ownership: admin can upload to official courses, creator to their own custom courses
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	const isAdmin = profile?.role === 'admin';

	if (lesson.course_type === 'custom') {
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

	const fileId = crypto.randomUUID();
	const storagePath = `${lessonId}/${fileId}/${file.name}`;

	// Upload raw file to Supabase Storage
	const fileBuffer = await file.arrayBuffer();
	const { error: uploadError } = await supabase.storage
		.from('lesson-files')
		.upload(storagePath, fileBuffer, {
			contentType: file.type || 'application/octet-stream',
			upsert: false
		});

	if (uploadError) {
		console.error('Storage upload error:', uploadError);
		return json({ error: 'Failed to upload file to storage' }, { status: 500 });
	}

	let compiledPath: string | null = null;

	// For .svelte files: compile and store the JS
	if (fileType === 'svelte') {
		try {
			const source = await file.text();
			const result = compile(source, {
				generate: 'client',
				filename: file.name
			});

			const compiledJs = result.js.code;
			compiledPath = `${lessonId}/${fileId}/compiled.js`;

			const compiledBuffer = new TextEncoder().encode(compiledJs);
			const { error: compileUploadError } = await supabase.storage
				.from('lesson-files')
				.upload(compiledPath, compiledBuffer, {
					contentType: 'application/javascript',
					upsert: false
				});

			if (compileUploadError) {
				console.error('Compiled JS upload error:', compileUploadError);
				// Clean up the source file
				await supabase.storage.from('lesson-files').remove([storagePath]);
				return json({ error: 'Failed to store compiled component' }, { status: 500 });
			}
		} catch (compileError) {
			console.error('Svelte compile error:', compileError);
			await supabase.storage.from('lesson-files').remove([storagePath]);
			return json(
				{
					error:
						compileError instanceof Error
							? `Compile error: ${compileError.message}`
							: 'Failed to compile Svelte component'
				},
				{ status: 422 }
			);
		}
	}

	// Insert DB row
	const { data: lessonFile, error: dbError } = await supabase
		.from('lesson_files')
		.insert({
			id: fileId,
			lesson_id: lessonId,
			file_name: file.name,
			file_type: fileType,
			storage_path: storagePath,
			compiled_path: compiledPath,
			tab_order: tabOrder
		})
		.select()
		.single();

	if (dbError) {
		console.error('DB insert error:', dbError);
		// Clean up storage
		const toRemove = [storagePath];
		if (compiledPath) toRemove.push(compiledPath);
		await supabase.storage.from('lesson-files').remove(toRemove);
		return json({ error: 'Failed to save file record' }, { status: 500 });
	}

	return json(lessonFile, { status: 201 });
};
