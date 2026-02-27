import type { Component } from 'svelte';

/**
 * Registry of interactive lesson components.
 *
 * The `svelte_component` column in the `lessons` DB table stores a key from
 * this map (e.g. "SpaceProbeLesson1"). DynamicLesson looks up the key here
 * and mounts the corresponding compiled Svelte component.
 *
 * To add a new interactive lesson:
 *   1. Create the component at src/lib/lessons/YourComponent.svelte
 *   2. Import it below and add it to the map with a string key
 *   3. Store that key string in the lesson's `svelte_component` DB column
 */

// Example (uncomment when the file exists):
// import SpaceProbeLesson1 from './lessons/SpaceProbeLesson1.svelte';

export const lessonComponents: Record<string, Component> = {
  // SpaceProbeLesson1,
};
