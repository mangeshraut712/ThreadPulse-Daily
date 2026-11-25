declare module "../../public/sw-scope.js" {
  export const PRECACHE_PATHS: readonly string[];
  export function relativeToScope(scope: string, pathname: string): string | null;
  export function isStaticAsset(relativePath: string): boolean;
  export function urlInScope(scope: string, relativePath: string): string;
  export function builtAssetPaths(fileNames: readonly string[]): string[];
  export function precacheRequestUrls(scope: string, builtAssets: readonly string[]): string[];
  export function precacheManifestSource(fileNames: readonly string[]): string;
  export function notificationDestination(scope: string, origin: string, target: unknown): string;
}
