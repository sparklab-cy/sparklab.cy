import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, supabase } = locals;
  
  if (!user) {
    throw redirect(302, '/login?redirect=/dashboard');
  }
  
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }
    
    // Get user's kit access
    const { data: userKits, error: kitsError } = await supabase
      .from('user_kits')
      .select(`
        kit_id,
        kits (
          id,
          name,
          level,
          theme,
          image_url,
          description
        )
      `)
      .eq('user_id', user.id);
    
    if (kitsError) {
      console.error('Error fetching user kits:', kitsError);
    }
    
    // Get user progress for all courses
    const { data: userProgress, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select(`
        *,
        lessons (
          id,
          title,
          course_id
        ),
        official_courses (
          id,
          title
        ),
        custom_courses (
          id,
          title
        )
      `)
      .eq('user_id', user.id);
    
    if (progressError) {
      console.error('Error fetching user progress:', progressError);
    }
    
    // Get recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }
    
    // Calculate analytics
    const analytics = {
      totalCourses: userProgress?.length || 0,
      completedCourses: userProgress?.filter(p => p.status === 'completed').length || 0,
      inProgressCourses: userProgress?.filter(p => p.status === 'in_progress').length || 0,
      totalLessons: userProgress?.length || 0,
      completedLessons: userProgress?.filter(p => p.status === 'completed').length || 0,
      averageCompletionTime: 0, // TODO: Calculate from completion timestamps
      learningStreak: 0 // TODO: Calculate consecutive days of learning
    };
    
    // Process user progress to include course titles
    const processedProgress = (userProgress || []).map(progress => {
      let courseTitle = 'Unknown Course';
      let courseId = null;
      
      if (progress.official_courses) {
        courseTitle = progress.official_courses.title;
        courseId = progress.official_courses.id;
      } else if (progress.custom_courses) {
        courseTitle = progress.custom_courses.title;
        courseId = progress.custom_courses.id;
      }
      
      return {
        ...progress,
        course_title: courseTitle,
        course_id: courseId,
        lesson_title: progress.lessons?.title || 'Unknown Lesson'
      };
    });
    
    // Process user kits to flatten the structure
    const processedKits = (userKits || []).map(userKit => userKit.kits).filter(Boolean);
    
    // Ensure kits are properly typed as individual objects, not arrays
    const flattenedKits = processedKits.map(kit => {
      if (Array.isArray(kit)) {
        return kit[0]; // Take first item if it's an array
      }
      return kit;
    }).filter(Boolean);
    
    return {
      user,
      profile: profile || { role: 'student' },
      userProgress: processedProgress,
      userKits: flattenedKits,
      recentOrders: recentOrders || [],
      analytics
    };
    
  } catch (error) {
    console.error('Dashboard load error:', error);
    return {
      user,
      profile: { role: 'student' },
      userProgress: [],
      userKits: [],
      recentOrders: [],
      analytics: {
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLessons: 0,
        completedLessons: 0,
        averageCompletionTime: 0,
        learningStreak: 0
      },
      error: 'Failed to load dashboard data'
    };
  }
}; 