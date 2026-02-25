<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CustomCourse, Lesson, UserProgress } from '$lib/types/courses';
  
  const { data } = $props();
  const { course, lessons, userProgress, error } = data;
  
  function getLessonStatus(lessonId: string): 'not_started' | 'in_progress' | 'completed' {
    const progress = userProgress.find(p => p.lesson_id === lessonId);
    return progress?.status || 'not_started';
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
      <div class="course-info">
        <h1>{course.title}</h1>
        <p class="description">{course.description}</p>
        <div class="meta">
          <span class="creator">By {course.creator?.full_name || course.creator?.email || 'Unknown'}</span>
          {#if course.estimated_duration}
            <span class="duration">• {course.estimated_duration} min</span>
          {/if}
          <span class="price">
            {#if course.price > 0}
              • ${course.price}
            {:else}
              • Free
            {/if}
          </span>
        </div>
      </div>
      
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {getProgressPercentage()}%"></div>
        </div>
        <p class="progress-text">{getProgressPercentage()}% Complete</p>
      </div>
    </div>
    
    <div class="lessons-section">
      <h2>Lessons</h2>
      {#if lessons.length === 0}
        <p class="no-lessons">No lessons available yet.</p>
      {:else}
        <div class="lessons-list">
          {#each lessons as lesson, index}
            <div class="lesson-item">
              <div class="lesson-info">
                <span class="lesson-number">{index + 1}</span>
                <div class="lesson-details">
                  <h3>{lesson.title}</h3>
                  {#if lesson.estimated_duration}
                    <span class="lesson-duration">{lesson.estimated_duration} min</span>
                  {/if}
                </div>
              </div>
              
              <div class="lesson-status">
                {#if getLessonStatus(lesson.id) === 'completed'}
                  <span class="status completed">Completed</span>
                {:else if getLessonStatus(lesson.id) === 'in_progress'}
                  <span class="status in-progress">In Progress</span>
                {:else}
                  <span class="status not-started">Not Started</span>
                {/if}
              </div>
              
              <a 
                href="/courses/community/{course.id}/lessons/{lesson.id}" 
                class="lesson-link"
              >
                {#if getLessonStatus(lesson.id) === 'completed'}
                  Review
                {:else}
                  Start
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
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #eee;
  }
  
  .course-info h1 {
    color: #333;
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
  }
  
  .description {
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  .meta {
    display: flex;
    gap: 1rem;
    color: #666;
    font-size: 0.9rem;
  }
  
  .creator {
    font-weight: bold;
    color: #e96b00;
  }
  
  .progress-section {
    text-align: center;
    min-width: 200px;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }
  
  .lessons-section h2 {
    color: #333;
    margin-bottom: 2rem;
  }
  
  .no-lessons {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 3rem;
  }
  
  .lessons-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .lesson-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border: 1px solid #eee;
    border-radius: 8px;
    transition: all 0.3s;
  }
  
  .lesson-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #e96b00;
  }
  
  .lesson-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  
  .lesson-number {
    background: #e96b00;
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
  
  .lesson-details h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
  }
  
  .lesson-duration {
    color: #666;
    font-size: 0.9rem;
  }
  
  .lesson-status {
    margin: 0 1rem;
  }
  
  .status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status.completed {
    background: #e8f5e8;
    color: #4CAF50;
  }
  
  .status.in-progress {
    background: #fff3e0;
    color: #ff9800;
  }
  
  .status.not-started {
    background: #f5f5f5;
    color: #666;
  }
  
  .lesson-link {
    padding: 8px 16px;
    background: #e96b00;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    transition: background 0.3s;
  }
  
  .lesson-link:hover {
    background: #d65a00;
  }
  
  .error {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }
</style> 