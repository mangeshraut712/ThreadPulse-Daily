export const PRECACHE_PATHS = Object.freeze([
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
]);

function scopePrefix(scope) {
  const url = new URL(scope);
  return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
}

export function relativeToScope(scope, pathname) {
  const prefix = scopePrefix(scope);
  if (pathname === prefix || pathname === prefix.slice(0, -1)) return "index.html";
  if (!pathname.startsWith(prefix)) return null;
  const relative = pathname.slice(prefix.length);
  return relative.length > 0 ? relative : "index.html";
}

export function isStaticAsset(relativePath) {
  return PRECACHE_PATHS.includes(relativePath)
    || /\.(?:js|css|png|webp|svg|ico|woff2)$/.test(relativePath);
}

export function urlInScope(scope, relativePath) {
  const base = scope.endsWith("/") ? scope : `${scope}/`;
  return new URL(relativePath, base).href;
}

export function notificationDestination(scope, origin, target) {
  if (typeof target !== "string" || target.length === 0) return scope;
  try {
    const url = new URL(target, scope);
    if (url.origin !== origin) return scope;
    if (relativeToScope(scope, url.pathname) === null) return scope;
    return url.href;
  } catch {
    return scope;
  }
}
