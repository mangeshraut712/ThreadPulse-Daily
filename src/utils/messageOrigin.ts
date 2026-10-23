const TRUSTED_SUFFIXES = ["reddit.com", "redditmedia.com", "redd.it", "devvit.net", "snoo.dev"];

export function isTrustedMessageOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    return url.protocol === "http:" || url.protocol === "https:";
  }
  if (url.protocol !== "https:") return false;
  return TRUSTED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export function trustedParentOrigin(): string | null {
  if (typeof window === "undefined" || window.parent === window) return null;

  const candidates: string[] = [];
  const ancestors = window.location.ancestorOrigins;
  if (ancestors && ancestors.length > 0) candidates.push(ancestors[0]);
  if (document.referrer) {
    try {
      candidates.push(new URL(document.referrer).origin);
    } catch {
      // Ignore malformed referrers.
    }
  }

  return candidates.find((origin) => isTrustedMessageOrigin(origin)) ?? null;
}
