import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

marked.use(
	markedHighlight({
		emptyLangClass: 'hljs',
		langPrefix: 'hljs language-',
		highlight(code, lang) {
			const l = lang?.trim();
			if (l && hljs.getLanguage(l)) {
				try {
					return hljs.highlight(code, { language: l }).value;
				} catch {
					/* fall through */
				}
			}
			try {
				return hljs.highlightAuto(code).value;
			} catch {
				return code
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
			}
		}
	})
);

marked.setOptions({
	gfm: true,
	breaks: false
});

const purifyConfig: DOMPurify.Config = {
	USE_PROFILES: { html: true },
	ADD_ATTR: ['target', 'rel', 'class', 'id', 'checked', 'disabled', 'type', 'align']
};

/**
 * Renders lesson markdown to sanitized HTML (syntax highlighting + GFM).
 * Configure once per module load; safe for {@html ...} in Svelte.
 */
export async function renderLessonMarkdown(source: string): Promise<string> {
	const raw = await Promise.resolve(marked.parse(source));
	const html = typeof raw === 'string' ? raw : String(raw);
	return DOMPurify.sanitize(html, purifyConfig);
}
