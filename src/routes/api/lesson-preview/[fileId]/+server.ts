import type { RequestHandler } from './$types';

// Pinned Svelte 5 version for the iframe import map.
// Update this when upgrading the app's own Svelte version.
const SVELTE_CDN = 'https://esm.sh/svelte@5';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase } = locals;
	const { fileId } = params;

	const { data: lessonFile, error } = await supabase
		.from('lesson_files')
		.select('file_type, compiled_path')
		.eq('id', fileId)
		.single();

	if (error || !lessonFile) {
		return new Response('<p>File not found</p>', {
			status: 404,
			headers: { 'Content-Type': 'text/html' }
		});
	}

	if (lessonFile.file_type !== 'svelte' || !lessonFile.compiled_path) {
		return new Response('<p>No compiled component available for this file.</p>', {
			status: 400,
			headers: { 'Content-Type': 'text/html' }
		});
	}

	// Get a public URL for the compiled JS stored in Supabase Storage
	const { data: urlData } = supabase.storage
		.from('lesson-files')
		.getPublicUrl(lessonFile.compiled_path);

	const compiledUrl = urlData.publicUrl;

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script type="importmap">
    {
      "imports": {
        "svelte": "${SVELTE_CDN}",
        "svelte/": "${SVELTE_CDN}/"
      }
    }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
    }
    #error {
      color: #dc3545;
      padding: 1rem;
      border: 1px solid #dc3545;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    async function init() {
      try {
        const { mount } = await import('svelte');
        const mod = await import(${JSON.stringify(compiledUrl)});
        const Component = mod.default;
        if (!Component) {
          throw new Error('Component file does not export a default component.');
        }
        mount(Component, { target: document.getElementById('app') });
      } catch (err) {
        document.getElementById('app').innerHTML =
          '<div id="error">Failed to load component:<br>' +
          (err instanceof Error ? err.message : String(err)) +
          '</div>';
        console.error(err);
      }
    }
    init();
  </script>
</body>
</html>`;

	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			// Prevent the iframe content from accessing the parent page
			'X-Frame-Options': 'SAMEORIGIN',
			'Content-Security-Policy':
				"default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://esm.sh; style-src 'unsafe-inline'; connect-src https:; img-src https: data:"
		}
	});
};
