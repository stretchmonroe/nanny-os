// Accept only this project's legacy public URLs or new bucket-relative paths.
// Never fetch arbitrary persisted URLs or fall back to a public URL on failure.
export function photoPath(source: string, projectUrl: string): string | null {
  let path = source;
  if (/^https?:/i.test(source)) {
    try {
      const url = new URL(source);
      const project = new URL(projectUrl);
      const prefix = "/storage/v1/object/public/photos/";
      if (url.origin !== project.origin || !url.pathname.startsWith(prefix) || url.search || url.hash) return null;
      path = decodeURIComponent(url.pathname.slice(prefix.length));
    } catch { return null; }
  }
  if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(path)) return null;
  if (["shared", "default"].includes(path.split("/")[0])) return null;
  return path;
}
