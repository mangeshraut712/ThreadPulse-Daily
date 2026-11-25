import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../public/manifest.json";
import {
  PRECACHE_PATHS,
  isStaticAsset,
  notificationDestination,
  relativeToScope,
  urlInScope,
} from "../../public/sw-scope.js";

const PAGES_SCOPE = "https://mangeshraut712.github.io/ThreadPulse-Daily/";
const PAGES_ORIGIN = "https://mangeshraut712.github.io";
const ROOT_SCOPE = "https://play.example/";

describe("service worker scope", () => {
  it("precaches the app shell relative to a GitHub Pages base path", () => {
    expect(relativeToScope(PAGES_SCOPE, "/ThreadPulse-Daily/index.html")).toBe("index.html");
    expect(relativeToScope(PAGES_SCOPE, "/ThreadPulse-Daily/")).toBe("index.html");
    expect(relativeToScope(PAGES_SCOPE, "/ThreadPulse-Daily")).toBe("index.html");
    expect(relativeToScope(PAGES_SCOPE, "/index.html")).toBeNull();
    expect(relativeToScope(PAGES_SCOPE, "/ThreadPulse-Daily-evil/index.html")).toBeNull();

    expect(relativeToScope(PAGES_SCOPE, "/ThreadPulse-Daily/assets/js/app.js")).toBe("assets/js/app.js");
    expect(isStaticAsset("assets/js/app.js")).toBe(true);
    expect(isStaticAsset("index.html")).toBe(true);
    expect(PRECACHE_PATHS.every((path) => !path.startsWith("/"))).toBe(true);

    expect(urlInScope(PAGES_SCOPE, "index.html")).toBe(
      "https://mangeshraut712.github.io/ThreadPulse-Daily/index.html"
    );
    expect(urlInScope(ROOT_SCOPE, "manifest.json")).toBe("https://play.example/manifest.json");
    expect(relativeToScope(ROOT_SCOPE, "/icon-192.png")).toBe("icon-192.png");
  });

  it("opens notifications inside the worker scope", () => {
    expect(notificationDestination(PAGES_SCOPE, PAGES_ORIGIN, "/ThreadPulse-Daily/")).toBe(PAGES_SCOPE);
    expect(notificationDestination(PAGES_SCOPE, PAGES_ORIGIN, "/")).toBe(PAGES_SCOPE);
    expect(notificationDestination(PAGES_SCOPE, PAGES_ORIGIN, "https://evil.test/phish")).toBe(PAGES_SCOPE);
    expect(notificationDestination(PAGES_SCOPE, PAGES_ORIGIN, "")).toBe(PAGES_SCOPE);
  });

  it("loads the tested scope helper from the worker", () => {
    const worker = readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");
    expect(worker).toContain('from "./sw-scope.js"');
    expect(worker).not.toContain('"/index.html"');
    expect(worker).toContain("self.registration.scope");
  });
});

describe("web app manifest", () => {
  it("resolves icons and the start URL against the manifest location", () => {
    expect(manifest.start_url.startsWith("./") || manifest.start_url === ".").toBe(true);
    expect(manifest.scope.startsWith("./") || manifest.scope === ".").toBe(true);
    expect(manifest.start_url.startsWith("/")).toBe(false);
    expect(manifest.scope.startsWith("/")).toBe(false);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith("/")).toBe(false);
    }
  });
});
