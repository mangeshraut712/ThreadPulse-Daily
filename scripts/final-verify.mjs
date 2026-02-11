#!/usr/bin/env node
/**
 * Final verification script for ThreadPulse Daily 2026
 * Comprehensive validation before hackathon submission
 */

import fs from 'fs';

console.log("🔍 ThreadPulse Daily — Final Verification\n");

let checks = { passed: 0, failed: 0, warnings: 0 };

function check(name, condition, isWarning = false) {
    if (condition) {
        console.log(`  ✅ ${name}`);
        checks.passed++;
    } else if (isWarning) {
        console.log(`  ⚠️  ${name}`);
        checks.warnings++;
    } else {
        console.error(`  ❌ ${name}`);
        checks.failed++;
    }
}

function fileExists(p) { return fs.existsSync(p); }
function fileSize(p) { try { return fs.statSync(p).size; } catch { return 0; } }

// 1. Required Files
console.log("1. Required Files");
check("package.json exists", fileExists("./package.json"));
check("vite.config.ts exists", fileExists("./vite.config.ts"));
check("tsconfig.json exists", fileExists("./tsconfig.json"));
check("index.html exists", fileExists("./index.html"));
check("README.md exists", fileExists("./README.md"));
check("README.md is substantial (>3KB)", fileSize("./README.md") > 3000, true);

// 2. Source Structure
console.log("\n2. Source Structure");
check("src/ directory exists", fileExists("./src"));
check("src/App.tsx exists", fileExists("./src/App.tsx"));
check("src/main.tsx exists", fileExists("./src/main.tsx"));
check("src/index.css exists", fileExists("./src/index.css"));
check("src/components/ exists", fileExists("./src/components"));
check("src/core/ exists", fileExists("./src/core"));
check("src/hooks/ exists", fileExists("./src/hooks"));
check("src/styles/ exists", fileExists("./src/styles"));
check("src/types/ exists", fileExists("./src/types"));
check("src/data/ exists", fileExists("./src/data"));

// 3. Core Components
console.log("\n3. Core Components");
check("GameBoard.tsx exists", fileExists("./src/components/GameBoard.tsx"));
check("Confetti.tsx exists", fileExists("./src/components/Confetti.tsx"));
check("ResultModal.tsx exists", fileExists("./src/components/ResultModal.tsx"));
check("dailyGameEngine.ts exists", fileExists("./src/core/dailyGameEngine.ts"));
check("puzzleBank.ts exists", fileExists("./src/data/puzzleBank.ts"));
check("design-system.css exists", fileExists("./src/styles/design-system.css"));
check("index.ts (types) exists", fileExists("./src/types/index.ts"));

// 4. Required Hooks
console.log("\n4. Required Hooks");
check("useGameStore.ts exists", fileExists("./src/hooks/useGameStore.ts"));
check("useAIAdaptive.ts exists", fileExists("./src/hooks/useAIAdaptive.ts"));
check("useAnalytics.ts exists", fileExists("./src/hooks/useAnalytics.ts"));
check("useCommunityFeatures.ts exists", fileExists("./src/hooks/useCommunityFeatures.ts"));
check("useGameMaker.ts exists", fileExists("./src/hooks/useGameMaker.ts"));
check("useHapticFeedback.ts exists", fileExists("./src/hooks/useHapticFeedback.ts"));
check("useMobileGestures.ts exists", fileExists("./src/hooks/useMobileGestures.ts"));

// 5. Static Assets
console.log("\n5. Static Assets");
check("public/ directory exists", fileExists("./public"));
check("manifest.json exists", fileExists("./public/manifest.json"));
check("sw.js (service worker) exists", fileExists("./public/sw.js"));
check("icon-192.png exists", fileExists("./public/icon-192.png"));
check("icon-512.png exists", fileExists("./public/icon-512.png"));

// 6. Integration & Documentation
console.log("\n6. Integration & Documentation");
check("apps/devvit/ exists", fileExists("./apps/devvit"));
check("apps/devvit/src/main.tsx exists", fileExists("./apps/devvit/src/main.tsx"));
check("packages/wasm/ exists", fileExists("./packages/wasm"));
check("packages/wasm/pkg/game_engine.js exists", fileExists("./packages/wasm/pkg/game_engine.js"));
check("packages/gamemaker/ exists", fileExists("./packages/gamemaker"));
check("docs/ exists", fileExists("./docs"));

// 7. Scripts
console.log("\n7. Scripts");
check("scripts/ directory exists", fileExists("./scripts"));
check("simulateGame.mjs exists", fileExists("./scripts/simulateGame.mjs"));
check("serve.mjs exists", fileExists("./scripts/serve.mjs"));
check("submission-check.mjs exists", fileExists("./scripts/submission-check.mjs"));
check("self-test.mjs exists", fileExists("./scripts/self-test.mjs"));
check("balance-check.mjs exists", fileExists("./scripts/balance-check.mjs"));
check("final-verify.mjs exists", fileExists("./scripts/final-verify.mjs"));

// 8. Content Quality
console.log("\n8. Content Quality");
try {
    const puzzleSrc = fs.readFileSync('./src/data/puzzleBank.ts', 'utf8');
    const puzzleCount = (puzzleSrc.match(/id:\s*"p\d+"/g) || []).length;
    check(`Puzzle bank has ${puzzleCount} puzzles (need 28+)`, puzzleCount >= 28);
} catch {
    check("Puzzle bank readable", false);
}

try {
    const appSrc = fs.readFileSync('./src/App.tsx', 'utf8');
    check("App.tsx uses GameMaker hook", appSrc.includes('useGameMaker'));
    check("App.tsx uses haptic feedback", appSrc.includes('useHapticFeedback'));
    check("App.tsx renders Confetti", appSrc.includes('Confetti'));
    check("App.tsx renders ResultModal", appSrc.includes('ResultModal'));
} catch {
    check("App.tsx readable", false);
}

try {
    const cssSrc = fs.readFileSync('./src/styles/design-system.css', 'utf8');
    check("CSS has dark mode", cssSrc.includes('prefers-color-scheme: dark'));
    check("CSS has accessibility (reduced-motion)", cssSrc.includes('prefers-reduced-motion'));
    check("CSS has glassmorphism", cssSrc.includes('backdrop-filter'));
} catch {
    check("CSS readable", false);
}

// Summary
console.log("\n" + "═".repeat(50));
console.log("📊 Verification Summary");
console.log("═".repeat(50));
console.log(`   ✅ Passed:   ${checks.passed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);
console.log(`   ❌ Failed:   ${checks.failed}`);

if (checks.failed > 0) {
    console.log("\n❌ Verification FAILED — Missing required items!");
    process.exit(1);
}

if (checks.warnings > 0) {
    console.log("\n⚠️  Verification passed with warnings");
}

console.log("\n✅ Final verification PASSED!");
console.log("🚀 Ready for submission\n");
process.exit(0);
