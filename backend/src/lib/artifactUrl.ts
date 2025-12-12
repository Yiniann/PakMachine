export const normalizeArtifactUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (/^[\w.-]+\.[A-Za-z]{2,}(\/|$)/.test(url)) {
    return `https://${url}`;
  }
  return url;
};
