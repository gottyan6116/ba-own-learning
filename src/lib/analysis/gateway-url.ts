/** Returns a canonical public HTTPS gateway URL, or null for a broken env value. */
export function resolveAnalysisGatewayUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
