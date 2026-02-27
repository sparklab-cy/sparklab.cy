<script lang="ts">
  import { mount, unmount } from 'svelte';
  import type { LessonContent } from '$lib/types/courses';
  import { lessonComponents } from '$lib/lessonComponents';

  const { lessonContent }: { lessonContent: LessonContent } = $props();

  let containerElement: HTMLElement | undefined = $state();
  let mountedInstance: Record<string, any> | undefined;
  let componentError = $state<string | null>(null);

  $effect(() => {
    if (
      lessonContent.type === 'svelte' &&
      lessonContent.svelteComponent &&
      containerElement
    ) {
      mountComponent(lessonContent.svelteComponent, lessonContent.componentProps ?? {});
    }

    return () => {
      if (mountedInstance) {
        unmount(mountedInstance);
        mountedInstance = undefined;
      }
    };
  });

  function mountComponent(componentKey: string, props: Record<string, any>) {
    if (mountedInstance) {
      unmount(mountedInstance);
      mountedInstance = undefined;
    }

    componentError = null;
    const Component = lessonComponents[componentKey];

    if (!Component) {
      componentError = `Interactive component "${componentKey}" is not registered.`;
      return;
    }

    mountedInstance = mount(Component, {
      target: containerElement!,
      props
    });
  }
</script>

<div class="dynamic-lesson">
  {#if lessonContent.type === 'svelte'}
    {#if componentError}
      <div class="component-error">{componentError}</div>
    {/if}
    <div bind:this={containerElement} class="svelte-component-container"></div>

  {:else if (lessonContent.type === 'text' || lessonContent.type === 'interactive') && lessonContent.blocks}
    <div class="static-content">
      {#each lessonContent.blocks as block}
        <div class="content-block">
          {#if block.type === 'paragraph'}
            <p>{block.content}</p>

          {:else if block.type === 'image'}
            <img src={block.content.src} alt={block.content.alt ?? ''} class="content-image" />

          {:else if block.type === 'video'}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video controls src={block.content.src} class="content-video"></video>

          {:else if block.type === 'code_editor'}
            <div class="code-block">
              {#if block.content.language}
                <div class="code-lang">{block.content.language}</div>
              {/if}
              <pre><code>{block.content.code}</code></pre>
            </div>

          {:else if block.type === 'quiz'}
            <div class="unsupported">
              Quiz blocks are not yet supported in this renderer.
            </div>

          {:else if block.type === 'circuit_diagram'}
            <div class="unsupported">
              Circuit diagram blocks are not yet supported in this renderer.
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
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .static-content {
    line-height: 1.7;
  }

  .content-block {
    margin-bottom: 1.5rem;
  }

  .content-image {
    max-width: 100%;
    border-radius: 8px;
  }

  .content-video {
    width: 100%;
    border-radius: 8px;
  }

  .code-block {
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  .code-lang {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }

  .code-block pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
  }

  .code-block code {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .component-error {
    color: var(--danger);
    padding: 1rem;
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--danger);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .unsupported,
  .unsupported-content {
    color: var(--muted);
    padding: 1.5rem;
    text-align: center;
    font-style: italic;
    background: var(--secondary-background);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
</style>
