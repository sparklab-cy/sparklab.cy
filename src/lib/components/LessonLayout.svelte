<script lang="ts">
  import { page } from '$app/state';
  import type { Lesson, UserProgress } from '$lib/types/courses';
  
  const { lessons, currentLesson, userProgress, courseType, courseId } = $props();
  
  const currentPath = $derived(page.url.pathname);
  
  function getLessonProgress(lessonId: string): UserProgress | undefined {
    return userProgress.find((p: UserProgress) => p.lesson_id === lessonId);
  }
  
  function getCurrentLessonIndex(): number {
    return lessons.findIndex((lesson: Lesson) => lesson.id === currentLesson.id);
  }
  
  function getPreviousLesson(): Lesson | null {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex > 0 ? lessons[currentIndex - 1] : null;
  }
  
  function getNextLesson(): Lesson | null {
    const currentIndex = getCurrentLessonIndex();
    return currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  }
  
  function getLessonUrl(lesson: Lesson): string {
    return `/courses/${courseType}/${courseId}/lessons/${lesson.id}`;
  }
</script>

<div class="lesson-layout">
  <!-- Sidebar -->
  <aside class="lesson-sidebar">
    <div class="sidebar-header">
      <h3>Course Lessons</h3>
      <div class="progress-info">
        {userProgress.filter((p: UserProgress) => p.status === 'completed').length} of {lessons.length} completed
      </div>
    </div>
    
    <nav class="lessons-nav">
      {#each lessons as lesson, index}
        <a 
          href={getLessonUrl(lesson)}
          class="lesson-nav-item"
          class:active={lesson.id === currentLesson.id}
          class:completed={getLessonProgress(lesson.id)?.status === 'completed'}
        >
          <div class="lesson-nav-number">{index + 1}</div>
          <div class="lesson-nav-content">
            <div class="lesson-nav-title">{lesson.title}</div>
            {#if lesson.estimated_duration}
              <div class="lesson-nav-duration">{lesson.estimated_duration} min</div>
            {/if}
          </div>
          <div class="lesson-nav-status">
            {#if getLessonProgress(lesson.id)?.status === 'completed'}
              <span class="status-icon completed">✓</span>
            {:else if getLessonProgress(lesson.id)?.status === 'in_progress'}
              <span class="status-icon in-progress">●</span>
            {:else}
              <span class="status-icon not-started">○</span>
            {/if}
          </div>
        </a>
      {/each}
    </nav>
  </aside>
  
  <!-- Main Content -->
  <main class="lesson-main">
    <slot />
  </main>
  
  <!-- Footer Navigation -->
  <footer class="lesson-footer">
    <div class="footer-nav">
      {#if getPreviousLesson()}
        {@const prevLesson = getPreviousLesson()!}
        <a href={getLessonUrl(prevLesson)} class="nav-btn prev">
          <span class="nav-icon">←</span>
          <div class="nav-content">
            <div class="nav-label">Previous</div>
            <div class="nav-title">{prevLesson.title}</div>
          </div>
        </a>
      {:else}
        <div class="nav-btn prev disabled">
          <span class="nav-icon">←</span>
          <div class="nav-content">
            <div class="nav-label">Previous</div>
            <div class="nav-title">No previous lesson</div>
          </div>
        </div>
      {/if}
      
      <div class="lesson-progress">
        Lesson {getCurrentLessonIndex() + 1} of {lessons.length}
      </div>
      
      {#if getNextLesson()}
        {@const nextLesson = getNextLesson()!}
        <a href={getLessonUrl(nextLesson)} class="nav-btn next">
          <div class="nav-content">
            <div class="nav-label">Next</div>
            <div class="nav-title">{nextLesson.title}</div>
          </div>
          <span class="nav-icon">→</span>
        </a>
      {:else}
        <div class="nav-btn next disabled">
          <div class="nav-content">
            <div class="nav-label">Next</div>
            <div class="nav-title">Course complete!</div>
          </div>
          <span class="nav-icon">→</span>
        </div>
      {/if}
    </div>
  </footer>
</div>

<style>
  .lesson-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: 1fr auto;
    height: 100vh;
    background: var(--background);
  }
  
  .lesson-sidebar {
    grid-column: 1;
    grid-row: 1 / 3;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  
  .sidebar-header h3 {
    color: var(--text);
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }
  
  .progress-info {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .lessons-nav {
    flex: 1;
    padding: 1rem 0;
  }
  
  .lesson-nav-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    color: var(--text);
    transition: background 0.2s;
    border-left: 3px solid transparent;
  }
  
  .lesson-nav-item:hover {
    background: var(--secondary-background);
  }
  
  .lesson-nav-item.active {
    background: var(--primary-color);
    color: white;
    border-left-color: var(--primary-dark);
  }
  
  .lesson-nav-item.completed {
    border-left-color: var(--primary-color);
  }
  
  .lesson-nav-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--secondary-background);
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 500;
    margin-right: 0.75rem;
  }
  
  .lesson-nav-item.active .lesson-nav-number {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .lesson-nav-content {
    flex: 1;
    min-width: 0;
  }
  
  .lesson-nav-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .lesson-nav-duration {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .lesson-nav-item.active .lesson-nav-duration {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .lesson-nav-status {
    margin-left: 0.5rem;
  }
  
  .status-icon {
    font-size: 1rem;
    font-weight: bold;
  }
  
  .status-icon.completed {
    color: var(--primary-color);
  }
  
  .lesson-nav-item.active .status-icon.completed {
    color: white;
  }
  
  .status-icon.in-progress {
    color: var(--warning);
  }
  
  .status-icon.not-started {
    color: var(--muted);
  }
  
  .lesson-main {
    grid-column: 2;
    grid-row: 1;
    padding: 2rem;
    overflow-y: auto;
  }
  
  .lesson-footer {
    grid-column: 2;
    grid-row: 2;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 1rem 2rem;
  }
  
  .footer-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .nav-btn {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: all 0.2s;
    min-width: 200px;
  }
  
  .nav-btn:hover:not(.disabled) {
    background: var(--secondary-background);
    border-color: var(--primary-color);
  }
  
  .nav-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .nav-btn.prev {
    justify-content: flex-start;
  }
  
  .nav-btn.next {
    justify-content: flex-end;
  }
  
  .nav-icon {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .nav-content {
    margin: 0 0.5rem;
  }
  
  .nav-label {
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .nav-title {
    font-weight: 500;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  
  .lesson-progress {
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .lesson-layout {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
    }
    
    .lesson-sidebar {
      grid-column: 1;
      grid-row: 1;
      height: auto;
      max-height: 200px;
    }
    
    .lesson-main {
      grid-column: 1;
      grid-row: 2;
      padding: 1rem;
    }
    
    .lesson-footer {
      grid-column: 1;
      grid-row: 3;
      padding: 1rem;
    }
    
    .footer-nav {
      flex-direction: column;
      gap: 1rem;
    }
    
    .nav-btn {
      width: 100%;
      justify-content: center;
    }
    
    .lesson-progress {
      order: -1;
    }
  }
</style> 