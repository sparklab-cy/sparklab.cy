<script lang="ts">
  import { enhance } from '$app/forms';
  import DynamicLesson from '$lib/components/DynamicLesson.svelte';
  import LessonFileTabs from '$lib/components/LessonFileTabs.svelte';
  import LessonLayout from '$lib/components/LessonLayout.svelte';
  import type { Lesson, UserProgress } from '$lib/types/courses';
  
  const { data } = $props();
  const { lesson, userProgress, lessonContent, lessons, course, error, lessonFiles } = data;
  
  // Find the current lesson's progress
  const currentLessonProgress = userProgress.find(p => p.lesson_id === lesson?.id);
  
  let isCompleting = $state(false);
  let completionError = $state<string | null>(null);
  
  function handleMarkComplete() {
    isCompleting = true;
    completionError = null;
  }
  
  function handleMarkCompleteResult(result: any) {
    isCompleting = false;
    
    if (result.type === 'failure') {
      completionError = result.data?.error || 'Failed to mark lesson complete';
    }
  }
</script>

{#if error}
  <div class="error">{error}</div>
{:else if lesson && lessons && course}
  <LessonLayout 
    {lessons} 
    currentLesson={lesson} 
    userProgress={userProgress} 
    courseType="community" 
    courseId={course.id}
  >
    <div class="lesson-content">
      <div class="lesson-header">
        <h1>{lesson.title}</h1>
        <div class="lesson-meta">
          {#if lesson.estimated_duration}
            <span class="duration">Estimated time: {lesson.estimated_duration} minutes</span>
          {/if}
          {#if currentLessonProgress?.status === 'completed'}
            <span class="completed">Completed</span>
          {/if}
        </div>
      </div>
      
      <div class="lesson-body">
        {#if lessonFiles && lessonFiles.length > 0}
          <LessonFileTabs files={lessonFiles} />
        {:else if lessonContent}
          <DynamicLesson lessonContent={lessonContent} />
        {:else}
          <div class="no-content">No content available for this lesson.</div>
        {/if}
      </div>
      
      {#if completionError}
        <div class="error-message">{completionError}</div>
      {/if}
      
      <div class="lesson-actions">
        {#if currentLessonProgress?.status !== 'completed'}
          <form 
            method="POST" 
            action="?/markComplete"
            use:enhance={() => {
              handleMarkComplete();
              return async ({ result }) => {
                handleMarkCompleteResult({ result });
              };
            }}
          >
            <button 
              type="submit" 
              class="complete-btn" 
              disabled={isCompleting}
            >
              {isCompleting ? 'Marking Complete...' : 'Mark as Complete'}
            </button>
          </form>
        {:else}
          <button class="completed-btn" disabled>Completed</button>
        {/if}
      </div>
    </div>
  </LessonLayout>
{:else}
  <div class="error">Lesson not found</div>
{/if}

<style>
  .lesson-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .lesson-header {
    margin-bottom: 2rem;
  }
  
  .lesson-header h1 {
    color: var(--text);
    margin-bottom: 1rem;
    font-size: 2rem;
  }
  
  .lesson-meta {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  
  .duration, .completed {
    background: var(--secondary-background);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .completed {
    background: var(--primary-color);
    color: white;
  }
  
  .lesson-body {
    margin-bottom: 3rem;
  }
  
  .no-content {
    text-align: center;
    padding: 3rem;
    color: var(--muted);
    font-style: italic;
    background: var(--secondary-background);
    border-radius: 8px;
  }
  
  .error-message {
    background: var(--danger);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .lesson-actions {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .complete-btn {
    padding: 0.75rem 1.5rem;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background 0.3s;
  }
  
  .complete-btn:hover:not(:disabled) {
    background: var(--primary-dark);
  }
  
  .complete-btn:disabled {
    background: var(--muted);
    cursor: not-allowed;
  }
  
  .completed-btn {
    padding: 0.75rem 1.5rem;
    background: var(--muted);
    color: var(--text);
    border: none;
    border-radius: 8px;
    cursor: not-allowed;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .error {
    text-align: center;
    padding: 3rem;
    color: white;
    background: var(--danger);
    border-radius: 8px;
    margin: 2rem;
  }
</style> 