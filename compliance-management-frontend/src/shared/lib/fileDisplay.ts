/**
 * Краткая подпись типа файла для UI (вместо длинного MIME).
 */
const EXT_LABEL: Record<string, string> = {
  docx: 'Word',
  doc: 'Word',
  pdf: 'PDF',
  xlsx: 'Excel',
  xls: 'Excel',
  pptx: 'PowerPoint',
  ppt: 'PowerPoint',
  txt: 'Текст',
  csv: 'CSV',
  zip: 'ZIP',
  rar: 'RAR',
  '7z': '7-Zip',
  png: 'PNG',
  jpg: 'JPEG',
  jpeg: 'JPEG',
  gif: 'GIF',
  webp: 'WebP',
  svg: 'SVG',
  mp4: 'Видео',
  mov: 'Видео',
  mp3: 'Аудио',
  wav: 'Аудио',
};

const MIME_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'text/plain': 'Текст',
  'text/csv': 'CSV',
  'application/zip': 'ZIP',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'image/svg+xml': 'SVG',
};

export function getFileKindShortLabel(fileName: string, mimeType: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext && EXT_LABEL[ext]) {
    return EXT_LABEL[ext];
  }
  const byMime = mimeType?.trim();
  if (byMime) {
    if (MIME_LABEL[byMime]) {
      return MIME_LABEL[byMime];
    }
    if (byMime.startsWith('image/')) {
      return 'Изображение';
    }
    if (byMime.startsWith('video/')) {
      return 'Видео';
    }
    if (byMime.startsWith('audio/')) {
      return 'Аудио';
    }
  }
  if (ext) {
    return ext.toUpperCase();
  }
  return 'Файл';
}
