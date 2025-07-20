export interface LearningEvent {
  userId: string;
  eventType: 'lesson_started' | 'lesson_completed' | 'course_started' | 'course_completed' | 'quiz_attempted' | 'quiz_completed';
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  score?: number;
  duration?: number; // in seconds
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserAnalytics {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalTimeSpent: number; // in minutes
  averageCompletionTime: number; // in minutes
  learningStreak: number; // consecutive days
  lastActiveDate: Date;
  favoriteTopics: string[];
  learningGoals: string[];
  achievements: string[];
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  averageTimeToComplete: number;
  averageScore: number;
  difficultyRating: number;
  userSatisfaction: number;
  popularLessons: string[];
  commonIssues: string[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private apiUrl: string;
  
  private constructor() {
    this.apiUrl = '/api/analytics';
  }
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  async trackEvent(event: LearningEvent): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }
  
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const response = await fetch(`${this.apiUrl}/user/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user analytics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return this.getDefaultUserAnalytics();
    }
  }
  
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    try {
      const response = await fetch(`${this.apiUrl}/course/${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course analytics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get course analytics:', error);
      return this.getDefaultCourseAnalytics(courseId);
    }
  }
  
  async getLearningInsights(userId: string): Promise<{
    recommendedCourses: string[];
    learningPath: string[];
    timeToComplete: number;
    nextMilestone: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/insights/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning insights');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get learning insights:', error);
      return {
        recommendedCourses: [],
        learningPath: [],
        timeToComplete: 0,
        nextMilestone: 'Complete your first lesson'
      };
    }
  }
  
  async getProgressReport(userId: string, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<{
    period: string;
    lessonsCompleted: number;
    timeSpent: number;
    coursesStarted: number;
    coursesCompleted: number;
    averageScore: number;
    streakDays: number;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/progress/${userId}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress report');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get progress report:', error);
      return {
        period: timeframe,
        lessonsCompleted: 0,
        timeSpent: 0,
        coursesStarted: 0,
        coursesCompleted: 0,
        averageScore: 0,
        streakDays: 0
      };
    }
  }
  
  async generateAchievement(userId: string, achievementType: string): Promise<{
    success: boolean;
    achievement?: {
      id: string;
      type: string;
      title: string;
      description: string;
      icon: string;
      unlockedAt: Date;
    };
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/achievements/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          achievementType
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate achievement');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to generate achievement:', error);
      return { success: false };
    }
  }
  
  async getLeaderboard(category: 'courses' | 'lessons' | 'streak' = 'courses'): Promise<{
    rank: number;
    userId: string;
    userName: string;
    score: number;
    avatar?: string;
  }[]> {
    try {
      const response = await fetch(`${this.apiUrl}/leaderboard?category=${category}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }
  
  private getDefaultUserAnalytics(): UserAnalytics {
    return {
      totalCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      totalTimeSpent: 0,
      averageCompletionTime: 0,
      learningStreak: 0,
      lastActiveDate: new Date(),
      favoriteTopics: [],
      learningGoals: [],
      achievements: []
    };
  }
  
  private getDefaultCourseAnalytics(courseId: string): CourseAnalytics {
    return {
      courseId,
      courseTitle: 'Unknown Course',
      totalEnrollments: 0,
      activeEnrollments: 0,
      completionRate: 0,
      averageTimeToComplete: 0,
      averageScore: 0,
      difficultyRating: 0,
      userSatisfaction: 0,
      popularLessons: [],
      commonIssues: []
    };
  }
}

export const analyticsService = AnalyticsService.getInstance();

// Helper functions for common tracking events
export const trackLessonStarted = (userId: string, courseId: string, lessonId: string) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'lesson_started',
    courseId,
    lessonId,
    timestamp: new Date()
  });
};

export const trackLessonCompleted = (userId: string, courseId: string, lessonId: string, duration?: number) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'lesson_completed',
    courseId,
    lessonId,
    duration,
    timestamp: new Date()
  });
};

export const trackCourseStarted = (userId: string, courseId: string) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'course_started',
    courseId,
    timestamp: new Date()
  });
};

export const trackCourseCompleted = (userId: string, courseId: string, duration?: number) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'course_completed',
    courseId,
    duration,
    timestamp: new Date()
  });
};

export const trackQuizAttempted = (userId: string, courseId: string, quizId: string) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'quiz_attempted',
    courseId,
    quizId,
    timestamp: new Date()
  });
};

export const trackQuizCompleted = (userId: string, courseId: string, quizId: string, score: number) => {
  analyticsService.trackEvent({
    userId,
    eventType: 'quiz_completed',
    courseId,
    quizId,
    score,
    timestamp: new Date()
  });
}; 