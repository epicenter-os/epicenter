/**
 * MIME type mappings for audio and video files
 */
export const MIME_TYPE_MAP = {
	// Audio formats
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	m4a: 'audio/mp4',
	aac: 'audio/aac',
	ogg: 'audio/ogg',
	flac: 'audio/flac',
	wma: 'audio/x-ms-wma',
	opus: 'audio/opus',
	webm: 'audio/webm',
	// Video formats
	mp4: 'video/mp4',
	avi: 'video/x-msvideo',
	mov: 'video/quicktime',
	wmv: 'video/x-ms-wmv',
	flv: 'video/x-flv',
	mkv: 'video/x-matroska',
	m4v: 'video/mp4',
} as const;
