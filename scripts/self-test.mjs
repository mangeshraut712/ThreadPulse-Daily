#!/usr/bin/env node
/**
 * Self-test script for ThreadPulse Daily 2026
 * Comprehensive validation of project structure, components, and configuration.
 */

import fs from 'fs';

console.log("🧪 ThreadPulse Daily — Self Test Suite\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ ${name}: ${e.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// --- 1. Core Engine ---
console.log("1. Core Engine");

test("dailyGameEngine.ts exists", () => {
    assert(fs.existsSync('./src/core/dailyGameEngine.ts'), "Missing");
});

test("dailyGameEngine exports required functions", () => {
    const src = fs.readFileSync('./src/core/dailyGameEngine.ts', 'utf8');
    assert(src.includes('export function pickDailyPuzzle'), "Missing pickDailyPuzzle");
    assert(src.includes('export function evaluateGuess'), "Missing evaluateGuess");
    assert(src.includes('export function computeScore'), "Missing computeScore");
    assert(src.includes('export function validateCommunityClue'), "Missing validateCommunityClue");
    assert(src.includes('export function rankCommunityClues'), "Missing rankCommunityClues");
});

test("puzzleBank has 28+ puzzles for daily content", () => {
    const src = fs.readFileSync('./src/data/puzzleBank.ts', 'utf8');
    const count = (src.match(/id:\s*"p\d+"/g) || []).length;
    assert(count >= 28, `Only ${count} puzzles — need 28+ for a full month`);
});

// --- 2. Components ---
console.log("\n2. UI Components");

test("GameBoard.tsx exists", () => {
    assert(fs.existsSync('./src/components/GameBoard.tsx'), "Missing");
});

test("GameBoard has proper game UI elements", () => {
    const src = fs.readFileSync('./src/components/GameBoard.tsx', 'utf8');
    assert(src.includes('puzzle-card'), "Missing puzzle card");
    assert(src.includes('guess-input'), "Missing guess input");
    assert(src.includes('hints-list'), "Missing hints list");
    assert(src.includes('Community Clues'), "Missing community clues section");
});

test("Confetti.tsx exists", () => {
    assert(fs.existsSync('./src/components/Confetti.tsx'), "Missing celebration component");
});

test("ResultModal.tsx exists", () => {
    assert(fs.existsSync('./src/components/ResultModal.tsx'), "Missing result sharing component");
});

test("ResultModal has share functionality", () => {
    const src = fs.readFileSync('./src/components/ResultModal.tsx', 'utf8');
    assert(src.includes('Share on Reddit'), "Missing Reddit share");
    assert(src.includes('clipboard'), "Missing clipboard copy");
    assert(src.includes('emojiGrid') || src.includes('emoji'), "Missing emoji grid for sharing");
});

// --- 3. Hooks ---
console.log("\n3. React Hooks");

test("useGameStore.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useGameStore.ts'), "Missing");
});

test("useAIAdaptive.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useAIAdaptive.ts'), "Missing");
});

test("useAnalytics.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useAnalytics.ts'), "Missing");
});

test("useCommunityFeatures.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useCommunityFeatures.ts'), "Missing");
});

test("useGameMaker.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useGameMaker.ts'), "Missing");
});

test("useHapticFeedback.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useHapticFeedback.ts'), "Missing");
});

test("useMobileGestures.ts exists", () => {
    assert(fs.existsSync('./src/hooks/useMobileGestures.ts'), "Missing");
});

// --- 4. App Shell ---
console.log("\n4. App Shell");

test("App.tsx integrates GameMaker hook", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('useGameMaker'), "GameMaker hook not used in App");
});

test("App.tsx integrates haptic feedback", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('useHapticFeedback'), "Haptic feedback hook not used in App");
});

test("App.tsx has confetti effect", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('Confetti'), "Confetti component not used in App");
});

test("App.tsx has result modal", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('ResultModal'), "ResultModal component not used in App");
});

test("App.tsx has live timer", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('timer') || src.includes('Timer'), "Timer not present in App");
});

// --- 5. Design System ---
console.log("\n5. Design System");

test("design-system.css exists", () => {
    assert(fs.existsSync('./src/styles/design-system.css'), "Missing");
});

test("design-system.css has dark mode support", () => {
    const src = fs.readFileSync('./src/styles/design-system.css', 'utf8');
    assert(src.includes('prefers-color-scheme: dark'), "Missing dark mode");
});

test("design-system.css has reduced-motion support", () => {
    const src = fs.readFileSync('./src/styles/design-system.css', 'utf8');
    assert(src.includes('prefers-reduced-motion'), "Missing reduced-motion a11y");
});

test("design-system.css has glassmorphism styles", () => {
    const src = fs.readFileSync('./src/styles/design-system.css', 'utf8');
    assert(src.includes('backdrop-filter') || src.includes('glass'), "Missing glassmorphism");
});

// --- 6. Configuration ---
console.log("\n6. Configuration");

test("TypeScript config exists", () => {
    assert(fs.existsSync('./tsconfig.json'), "Missing");
});

test("Vite config exists", () => {
    assert(fs.existsSync('./vite.config.ts'), "Missing");
});

test("PWA manifest exists", () => {
    assert(fs.existsSync('./public/manifest.json'), "Missing");
});

test("Service worker exists", () => {
    assert(fs.existsSync('./public/sw.js'), "Missing");
});

test("PWA icons exist", () => {
    assert(fs.existsSync('./public/icon-192.png'), "Missing 192px icon");
    assert(fs.existsSync('./public/icon-512.png'), "Missing 512px icon");
});

// --- 7. Integration Packages ---
console.log("\n7. Integration Packages");

test("Devvit app exists", () => {
    assert(fs.existsSync('./apps/devvit/src/main.tsx'), "Missing Devvit main");
});

test("devvit.json config exists", () => {
    assert(fs.existsSync('./apps/devvit/devvit.json'), "Missing devvit.json — will fail Devvit upload");
});

test("Devvit main.tsx uses proper API", () => {
    const src = fs.readFileSync('./apps/devvit/src/main.tsx', 'utf8');
    assert(src.includes('addCustomPostType'), "Missing custom post type");
    assert(src.includes('addMenuItem'), "Missing menu item for creating posts");
    assert(src.includes('redis'), "Missing Redis integration");
});

test("webroot/ exists with built game", () => {
    assert(fs.existsSync('./apps/devvit/webroot/index.html'), "Missing webroot — run npm run build:devvit");
});

test("Devvit message bridge exists", () => {
    assert(fs.existsSync('./src/utils/devvitBridge.ts'), "Missing devvitBridge.ts");
});

test("App.tsx uses devvitBridge", () => {
    const src = fs.readFileSync('./src/App.tsx', 'utf8');
    assert(src.includes('devvitBridge'), "devvitBridge not integrated in App");
});

test("WASM package exists", () => {
    assert(fs.existsSync('./packages/wasm/src/lib.rs'), "Missing Rust source");
    assert(fs.existsSync('./packages/wasm/pkg/game_engine.js'), "Missing JS wrapper");
});

test("GameMaker package exists", () => {
    assert(fs.existsSync('./packages/gamemaker/dist'), "Missing GameMaker dist");
});

// --- 8. Documentation ---
console.log("\n8. Documentation");

test("README.md exists and is substantial", () => {
    assert(fs.existsSync('./README.md'), "Missing");
    const size = fs.statSync('./README.md').size;
    assert(size > 2000, `README is only ${size} bytes — too small for hackathon`);
});

test("Architecture docs exist", () => {
    assert(fs.existsSync('./docs'), "Missing docs/ directory");
});

// --- Summary ---
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
    console.error("❌ Some tests failed!");
    process.exit(1);
} else {
    console.log("✅ All self-tests passed!");
    process.exit(0);
}
