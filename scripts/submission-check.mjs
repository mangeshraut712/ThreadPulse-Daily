#!/usr/bin/env node
/**
 * Checks the submission tree for required files and accidental secrets.
 */

import fs from "fs";
import path from "path";

const root = process.cwd();
const required = [
  "package.json",
  "src/core/dailyGameEngine.ts",
  "src/core/safety.ts",
  "src/hooks/useGameStore.ts",
  "public/sw.js",
  "apps/devvit/src/main.tsx",
  ".github/workflows/ci.yml",
];

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /sk_live_[0-9a-zA-Z]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
];

let failed = 0;

function fail(message) {
  console.error(`  ❌ ${message}`);
  failed += 1;
}

console.log("Submission check\n");

for (const file of required) {
  if (fs.existsSync(path.join(root, file))) console.log(`  ✅ ${file}`);
  else fail(`Missing ${file}`);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git" || entry.name === "webroot") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|mjs|json|css|html|yml|yaml)$/.test(entry.name)) files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  const text = fs.readFileSync(file, "utf8");
  const unsafeHtml = `dangerouslySet${"InnerHTML"}`;
  if (text.includes(unsafeHtml)) fail(`${path.relative(root, file)} uses unsafe HTML injection`);
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) fail(`${path.relative(root, file)} matches a secret pattern`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} submission check(s) failed.`);
  process.exit(1);
}

console.log("\nSubmission check passed.");
