#!/usr/bin/env node
/**
 * Build the game and copy it into the Devvit webroot.
 * This makes the Vite-built game playable inside Reddit's webview.
 *
 * Usage: node scripts/build-devvit.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const webrootDir = path.join(root, 'apps', 'devvit', 'webroot');

console.log('🔨 Building ThreadPulse Daily for Devvit...\n');

// Step 1: Build the Vite project
console.log('1️⃣  Running Vite production build...');
try {
    execSync('npx vite build', { cwd: root, stdio: 'inherit' });
    console.log('   ✅ Vite build complete\n');
} catch (e) {
    console.error('   ❌ Vite build failed');
    process.exit(1);
}

// Step 2: Clean webroot
console.log('2️⃣  Preparing webroot directory...');
if (fs.existsSync(webrootDir)) {
    fs.rmSync(webrootDir, { recursive: true, force: true });
}
fs.mkdirSync(webrootDir, { recursive: true });
console.log('   ✅ webroot cleaned\n');

// Step 3: Copy dist → webroot
console.log('3️⃣  Copying build output to webroot...');
function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            copyRecursive(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursive(distDir, webrootDir);
console.log('   ✅ Files copied\n');

// Step 4: Verify
const files = [];
function listFiles(dir, prefix = '') {
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const rel = prefix ? `${prefix}/${item}` : item;
        if (fs.statSync(full).isDirectory()) {
            listFiles(full, rel);
        } else {
            files.push(rel);
        }
    }
}
listFiles(webrootDir);

console.log('4️⃣  Webroot contents:');
files.forEach(f => console.log(`   📄 ${f}`));

console.log(`\n✅ Devvit webroot ready with ${files.length} files`);
console.log(`   Location: ${webrootDir}`);
console.log('\n🚀 Next steps:');
console.log('   cd apps/devvit');
console.log('   devvit upload');
console.log('   devvit publish');
