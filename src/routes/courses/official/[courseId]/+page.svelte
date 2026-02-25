<script lang="ts">
  import type { OfficialCourse, Lesson, UserProgress } from '$lib/types/courses';
  
  const { data } = $props();
  const { course, lessons, userProgress, error } = data;
  
  function getLessonProgress(lessonId: string): UserProgress | undefined {
    return userProgress.find(p => p.lesson_id === lessonId);
  }
  
  function getProgressPercentage(): number {
    if (lessons.length === 0) return 0;
    const completed = userProgress.filter(p => p.status === 'completed').length;
    return Math.round((completed / lessons.length) * 100);
  }
</script>

<div class="course-page">
  {#if error}
    <div class="error">{error}</div>
  {:else if course}
    <div class="course-header">
      <div class="course-image">
        <img src="/default-kit-image.jpg" alt={course.title} />
        <div class="course-overlay">
          <span class="course-type">Official Course</span>
          <span class="level-badge">Level {course.level}</span>
        </div>
      </div>
      
      <div class="course-info">
        <h1>{course.title}</h1>
        <p>{course.description}</p>
        
        <div class="course-meta">
          <span class="theme">{course.theme}</span>
          {#if course.estimated_duration}
            <span class="duration">{course.estimated_duration} minutes</span>
          {/if}
        </div>
        
        {#if userProgress.length > 0}
          <div class="progress-section">
            <div class="progress-info">
              <span class="progress-text">{getProgressPercentage()}% Complete</span>
              <span class="progress-count">
                {userProgress.filter(p => p.status === 'completed').length} of {lessons.length} lessons
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {getProgressPercentage()}%"></div>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="lessons-section">
      <div class="lessons-header">
        <h2>Course Lessons</h2>
        <div class="lessons-count">{lessons.length} lessons</div>
      </div>
      
      {#if lessons.length === 0}
        <div class="no-lessons">
          <p>No lessons available for this course yet.</p>
        </div>
      {:else}
        <div class="lessons-grid">
          {#each lessons as lesson, index}
            <div class="lesson-card">
              <div class="lesson-header">
                <div class="lesson-number">{index + 1}</div>
                <div class="lesson-status">
                  {#if getLessonProgress(lesson.id)}
                    {#if getLessonProgress(lesson.id)?.status === 'completed'}
                      <span class="status-icon completed">Done</span>
                    {:else}
                      <span class="status-icon in-progress">In Progress</span>
                    {/if}
                  {:else}
                    <span class="status-icon not-started">Not Started</span>
                  {/if}
                </div>
              </div>
              
              <div class="lesson-content">
                <h3>{lesson.title}</h3>
                {#if lesson.estimated_duration}
                  <div class="lesson-duration">{lesson.estimated_duration} min</div>
                {/if}
              </div>
              
              <a href="/courses/official/{course.id}/lessons/{lesson.id}" class="lesson-btn">
                {#if getLessonProgress(lesson.id)?.status === 'completed'}
                  Review Lesson
                {:else}
                  Start Lesson
                {/if}
              </a>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="error">Course not found</div>
  {/if}
</div>

<style>
  .course-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .course-header {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
    background: var(--surface);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  
  .course-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }
  
  .course-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .course-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .course-type, .level-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .course-type {
    background: rgba(0, 0, 0, 0.7);
    color: white;
  }
  
  .level-badge {
    background: var(--primary-color);
    color: white;
  }
  
  .course-info {
    padding: 2rem;
  }
  
  .course-info h1 {
    color: var(--text);
    margin-bottom: 1rem;
    font-size: 2rem;
  }
  
  .course-info p {
    color: var(--muted);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  .course-meta {
    display: flex;
    gap: 10px;
    margin: 1rem 0;
    flex-wrap: wrap;
  }
  
  .theme, .duration {
    background: var(--secondary-background);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .progress-section {
    margin-top: 1.5rem;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .progress-text {
    color: var(--text);
    font-weight: 500;
  }
  
  .progress-count {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .progress-bar {
    background: var(--secondary-background);
    border-radius: 20px;
    height: 8px;
    overflow: hidden;
  }
  
  .progress-fill {
    background: var(--primary-color);
    height: 100%;
    border-radius: 20px;
    transition: width 0.3s;
  }
  
  .lessons-section {
    margin-top: 2rem;
  }
  
  .lessons-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .lessons-header h2 {
    color: var(--text);
    margin: 0;
  }
  
  .lessons-count {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .no-lessons {
    text-align: center;
    color: var(--muted);
    font-style: italic;
    padding: 3rem;
    background: var(--secondary-background);
    border-radius: 8px;
  }
  
  .lessons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .lesson-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s;
    background: var(--surface);
  }
  
  .lesson-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .lesson-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .lesson-number {
    background: var(--primary-color);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  .status-icon {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .status-icon.completed {
    color: var(--primary-color);
  }
  
  .status-icon.in-progress {
    color: var(--warning);
  }
  
  .status-icon.not-started {
    color: var(--muted);
  }
  
  .lesson-content h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text);
    font-size: 1.1rem;
  }
  
  .lesson-duration {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .lesson-btn {
    display: inline-block;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--primary-color);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    text-align: center;
    font-weight: 500;
    margin-top: 1rem;
    transition: background 0.3s;
  }
  
  .lesson-btn:hover {
    background: var(--primary-dark);
  }
  
  .error {
    text-align: center;
    padding: 3rem;
    color: white;
    background: var(--danger);
    border-radius: 8px;
    margin: 2rem;
  }
  
  @media (max-width: 768px) {
    .course-header {
      grid-template-columns: 1fr;
    }
    
    .course-image {
      height: 150px;
    }
    
    .lessons-grid {
      grid-template-columns: 1fr;
    }
  }
</style>