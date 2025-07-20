<script lang="ts">
  import { onMount } from 'svelte';
  import type { LessonContent } from '$lib/types/courses';
  
  const { lessonContent } = $props();
  
  let componentElement: HTMLElement = $state(new HTMLElement());
  let componentInstance: any;
  
  onMount(() => {
    if (lessonContent.type === 'svelte' && lessonContent.svelteComponent) {
      loadSvelteComponent(lessonContent.svelteComponent, lessonContent.componentProps);
    }
  });
  
  async function loadSvelteComponent(componentCode: string, props: any = {}) {
    try {
      // Sanitize the component code
      const sanitizedCode = sanitizeComponentCode(componentCode);
      
      // Create a dynamic module
      const moduleCode = `
        import { createRoot } from 'svelte';
        ${sanitizedCode}
        export default Component;
      `;
      
      // Use dynamic import with a blob URL
      const blob = new Blob([moduleCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      const module = await import(url);
      const Component = module.default;
      
      // Mount the component
      componentInstance = new Component({
        target: componentElement,
        props
      });
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to load Svelte component:', error);
      componentElement.innerHTML = '<div class="error">Failed to load interactive content</div>';
    }
  }
  
  function sanitizeComponentCode(code: string): string {
    // Remove potentially dangerous imports
    const dangerousImports = [
      'fs', 'path', 'http', 'https', 'child_process', 
      'crypto', 'os', 'process', 'global'
    ];
    
    let sanitized = code;
    dangerousImports.forEach(importName => {
      const regex = new RegExp(`import\\s+.*?from\\s+['"]${importName}['"]`, 'g');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized;
  }
</script>

<div class="dynamic-lesson">
  {#if lessonContent.type === 'svelte'}
    <div bind:this={componentElement} class="svelte-component-container"></div>
  {:else if lessonContent.type === 'text' && lessonContent.blocks}
    <div class="static-content">
      {#each lessonContent.blocks as block}
        <div class="content-block">
          {#if block.type === 'paragraph'}
            <p>{block.content}</p>
          {:else if block.type === 'image'}
            <img src={block.content.src} alt={block.content.alt} />
          {:else if block.type === 'video'}
            <video controls src={block.content.src}></video>
          {:else if block.type === 'code_editor'}
            <div class="code-editor">
              <textarea>{block.content.code}</textarea>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="unsupported-content">
      Content type "{lessonContent.type}" is not supported yet.
    </div>
  {/if}
</div>

<style>
  .svelte-component-container {
    min-height: 200px;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .static-content {
    line-height: 1.6;
  }
  
  .content-block {
    margin-bottom: 20px;
  }
  
  .code-editor {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
  }
  
  .code-editor textarea {
    width: 100%;
    min-height: 100px;
    border: none;
    background: transparent;
    font-family: 'Courier New', monospace;
  }
  
  .error {
    color: red;
    padding: 20px;
    text-align: center;
  }
  
  .unsupported-content {
    color: #666;
    padding: 20px;
    text-align: center;
    font-style: italic;
  }
</style>