/** Lesson video tabs store YouTube as `storage_path`: `youtube:VIDEO_ID` */

const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeVideoId(raw: string): string | null {
	const s = raw.trim();
	if (!s) return null;
	const url = s.startsWith('http') ? s : `https://${s}`;
	try {
		const u = new URL(url);
		if (u.hostname === 'youtu.be') {
			const id = u.pathname.slice(1).split('/')[0];
			return YT_ID.test(id) ? id : null;
		}
		if (u.hostname.endsWith('youtube.com') || u.hostname === 'www.youtube.com') {
			const v = u.searchParams.get('v');
			if (v && YT_ID.test(v)) return v;
			const pathMatch = u.pathname.match(/^\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
			if (pathMatch) return pathMatch[2];
		}
	} catch {
		return null;
	}
	return null;
}

export function isYoutubeLessonVideo(storagePath: string): boolean {
	return storagePath.startsWith('youtube:');
}

export function youtubeEmbedSrc(storagePath: string): string | null {
	if (!isYoutubeLessonVideo(storagePath)) return null;
	const id = storagePath.slice('youtube:'.length);
	return YT_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
