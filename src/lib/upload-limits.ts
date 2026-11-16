/** Shared by the browser, which rejects a file right away, and the server, which has the last word. */
export const maxPhotoBytes = 50 * 1024 * 1024;

/** A photo's description: a line, not a post. */
export const maxCaptionLength = 150;

/** What phones produce. SVG stays out on purpose: it is a document, not a photo. */
export const allowedPhotoTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
];

/** Whether the browser should even try to send a file. The server checks again. */
export function isAcceptedPhoto(file: { type: string; size: number }) {
  return allowedPhotoTypes.includes(file.type) && file.size <= maxPhotoBytes;
}
