/**
 * Triggers a browser file download
 */
export const triggerDownload = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
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
 * Sanitizes a string for use in a filename
 * - Removes or replaces special characters
 * - Limits length
 * - Converts spaces to dashes
 */
export const sanitizeForFilename = (str: string, maxLength: number = 50): string => {
  if (!str) return '';

  return str
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .slice(0, maxLength)
    .replace(/[_-]+$/, '');
};
