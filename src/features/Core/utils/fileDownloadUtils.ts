/**
 * Triggers a browser file download for an already-built blob
 */
export const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a browser file download
 */
export const triggerDownload = (content: string, filename: string, mimeType: string): void => {
  triggerBlobDownload(new Blob([content], { type: mimeType }), filename);
};

/**
 * Sanitizes a string for use in a filename
 * - Removes or replaces special characters
 * - Limits length
 * - Converts spaces to dashes
 */
const trimTrailingFilenameSeparators = (value: string): string => {
  let end = value.length;
  while (end > 0 && (value[end - 1] === '-' || value[end - 1] === '_')) {
    end -= 1;
  }
  return value.slice(0, end);
};

export const sanitizeForFilename = (str: string, maxLength: number = 50): string => {
  if (!str) return '';

  const sanitized = str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .slice(0, maxLength);

  return trimTrailingFilenameSeparators(sanitized);
};
