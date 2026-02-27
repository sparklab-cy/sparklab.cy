import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const { courseId } = params;
    const { user, supabase } = locals;
    
    // Check admin permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
    
    if (!user || profile?.role !== 'admin') {
        throw redirect(302, '/');
    }

    try {
        // Load course details
        const { data: course, error: courseError } = await supabase
            .from('official_courses')
            .select(`
                *,
                kit:kits(name, theme, level)
            `)
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            throw redirect(302, '/admin');
        }

        // Load lessons for this course
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .eq('course_type', 'official')
            .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Load lesson files for all lessons in this course
        const lessonIds = (lessons || []).map((l: { id: string }) => l.id);
        let lessonFilesMap: Record<string, any[]> = {};

        if (lessonIds.length > 0) {
            const { data: allFiles } = await supabase
                .from('lesson_files')
                .select('*')
                .in('lesson_id', lessonIds)
                .order('tab_order', { ascending: true });

            for (const file of allFiles ?? []) {
                if (!lessonFilesMap[file.lesson_id]) lessonFilesMap[file.lesson_id] = [];
                lessonFilesMap[file.lesson_id].push(file);
            }
        }

        return {
            course,
            lessons: lessons || [],
            lessonFilesMap,
            error: null
        };

    } catch (error) {
        console.error('Failed to load course:', error);
        return {
            course: null,
            lessons: [],
            lessonFilesMap: {},
            error: 'Failed to load course'
        };
    }
};

export const actions: Actions = {
    createLesson: async ({ request, params, locals }) => {
        const { courseId } = params;
        const { user, supabase } = locals;
        
        // Check admin permissions
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
        
        if (!user || profile?.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const formData = await request.formData();
            const title = formData.get('title') as string;
            const content_type = formData.get('content_type') as string;
            const order_index = parseInt(formData.get('order_index') as string);
            const estimated_duration = formData.get('estimated_duration') ? 
                parseInt(formData.get('estimated_duration') as string) : null;

            let content = null;
            let svelte_component = null;
            let component_props = null;

            if (content_type === 'svelte') {
                const svelteFile = formData.get('svelte_file') as File;
                if (svelteFile) {
                    svelte_component = await svelteFile.text();
                }
                const propsText = formData.get('component_props') as string;
                if (propsText) {
                    try {
                        component_props = JSON.parse(propsText);
                    } catch (e) {
                        component_props = {};
                    }
                }
            } else {
                const contentText = formData.get('content') as string;
                if (contentText) {
                    content = contentText;
                }
            }

            const { data, error } = await supabase
                .from('lessons')
                .insert({
                    course_id: courseId,
                    course_type: 'official',
                    title,
                    content,
                    svelte_component,
                    component_props,
                    content_type,
                    order_index,
                    estimated_duration,
                    is_published: false
                })
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, lessonId: data.id };
        } catch (error) {
            console.error('Failed to create lesson:', error);
            return { success: false, error: 'Failed to create lesson' };
        }
    },

    updateLesson: async ({ request, params, locals }) => {
        const { user, supabase } = locals;
        
        // Check admin permissions
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
        
        if (!user || profile?.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const formData = await request.formData();
            const lessonId = formData.get('lessonId') as string;
            const title = formData.get('title') as string;
            const content_type = formData.get('content_type') as string;
            const order_index = parseInt(formData.get('order_index') as string);
            const estimated_duration = formData.get('estimated_duration') ? 
                parseInt(formData.get('estimated_duration') as string) : null;

            let content = null;
            let svelte_component = null;
            let component_props = null;

            if (content_type === 'svelte') {
                const svelteFile = formData.get('svelte_file') as File;
                if (svelteFile && svelteFile.size > 0) {
                    svelte_component = await svelteFile.text();
                }
                const propsText = formData.get('component_props') as string;
                if (propsText) {
                    try {
                        component_props = JSON.parse(propsText);
                    } catch (e) {
                        component_props = {};
                    }
                }
            } else {
                const contentText = formData.get('content') as string;
                if (contentText) {
                    content = contentText;
                }
            }

            const updateData: any = {
                title,
                content_type,
                order_index,
                estimated_duration
            };

            if (content !== null) updateData.content = content;
            if (svelte_component !== null) updateData.svelte_component = svelte_component;
            if (component_props !== null) updateData.component_props = component_props;

            const { error } = await supabase
                .from('lessons')
                .update(updateData)
                .eq('id', lessonId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to update lesson:', error);
            return { success: false, error: 'Failed to update lesson' };
        }
    },

    toggleLessonPublish: async ({ request, locals }) => {
        const { user, supabase } = locals;
        
        // Check admin permissions
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
        
        if (!user || profile?.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const formData = await request.formData();
            const lessonId = formData.get('lessonId') as string;
            const isPublished = formData.get('isPublished') === 'true';

            const { error } = await supabase
                .from('lessons')
                .update({ is_published: isPublished })
                .eq('id', lessonId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to toggle lesson publish:', error);
            return { success: false, error: 'Failed to update lesson' };
        }
    },

    deleteLesson: async ({ request, locals }) => {
        const { user, supabase } = locals;
        
        // Check admin permissions
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();
        
        if (!user || profile?.role !== 'admin') {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            const formData = await request.formData();
            const lessonId = formData.get('lessonId') as string;

            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            return { success: false, error: 'Failed to delete lesson' };
        }
    }
}; 