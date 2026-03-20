<script lang="ts">
  import { onMount } from 'svelte';
  import { getCurrentTheme } from '$lib/colors';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let animId: number;

  let mouseX = -1000;
  let mouseY = -1000;
  let targetX = -1000;
  let targetY = -1000;

  const SPACING = 40;
  const DOT_RADIUS = 1.5;
  const PULL_RADIUS = 100;
  const PULL_STRENGTH = -7;
  const LERP_SPEED = 0.08;

  interface Dot {
    baseX: number;
    baseY: number;
    x: number;
    y: number;
  }

  let dots: Dot[] = [];
  let cols = 0;
  let rows = 0;

  function buildGrid() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    cols = Math.ceil(w / SPACING) + 1;
    rows = Math.ceil(h / SPACING) + 1;

    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = c * SPACING;
        const by = r * SPACING;
        dots.push({ baseX: bx, baseY: by, x: bx, y: by });
      }
    }
  }

  function draw() {
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Smooth mouse tracking
    targetX += (mouseX - targetX) * LERP_SPEED;
    targetY += (mouseY - targetY) * LERP_SPEED;

    ctx.clearRect(0, 0, w, h);

    const theme = getCurrentTheme();
    const lineColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const dotColor = theme === 'dark' ? 'rgba(116,118,252,0.18)' : 'rgba(116,118,252,0.14)';

    // Update dot positions (pull toward cursor)
    for (const dot of dots) {
      const dx = targetX - dot.baseX;
      const dy = targetY - dot.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let pullX = 0;
      let pullY = 0;

      if (dist < PULL_RADIUS && dist > 0) {
        const force = (1 - dist / PULL_RADIUS) * PULL_STRENGTH;
        pullX = (dx / dist) * force;
        pullY = (dy / dist) * force;
      }

      // Lerp current position toward target
      const goalX = dot.baseX + pullX;
      const goalY = dot.baseY + pullY;
      dot.x += (goalX - dot.x) * 0.12;
      dot.y += (goalY - dot.y) * 0.12;
    }

    // Draw grid lines (from displaced dots)
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.5;

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const dot = dots[r * cols + c];
        if (c === 0) ctx.moveTo(dot.x, dot.y);
        else ctx.lineTo(dot.x, dot.y);
      }
      ctx.stroke();
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const dot = dots[r * cols + c];
        if (r === 0) ctx.moveTo(dot.x, dot.y);
        else ctx.lineTo(dot.x, dot.y);
      }
      ctx.stroke();
    }

    // Draw node dots
    ctx.fillStyle = dotColor;
    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  const PASSTHROUGH_TAGS = new Set(['HTML', 'BODY', 'MAIN', 'SECTION', 'DIV']);

  function isBackground(el: Element | null): boolean {
    if (!el) return false;
    const tag = el.tagName;
    if (!PASSTHROUGH_TAGS.has(tag)) return false;
    // Check if element is interactive or a styled component
    if (el.closest('button, a, input, select, textarea, nav, aside, header, footer, form, label, img, video, iframe, canvas, [role="button"], [role="tab"], [role="dialog"], .bento-card, .step-card, .theme-card, .auth-card, .ticker')) {
      return false;
    }
    return true;
  }

  function handleMouseMove(e: MouseEvent) {
    if (isBackground(e.target as Element)) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    } else {
      mouseX = -1000;
      mouseY = -1000;
    }
  }

  function handleMouseLeave() {
    mouseX = -1000;
    mouseY = -1000;
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    buildGrid();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', buildGrid);

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', buildGrid);
    };
  });
</script>

<canvas bind:this={canvas} class="mesh-canvas" aria-hidden="true"></canvas>

<style>
  .mesh-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    width: 100%;
    height: 100%;
  }
</style>
