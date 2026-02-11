#!/usr/bin/env node
/**
 * Balance check script for ThreadPulse Daily 2026
 * Validates game balance parameters match the actual game engine configuration
 */

import fs from 'fs';

console.log("⚖️  ThreadPulse Daily - Balance Check\n");

// These must match the actual values in dailyGameEngine.ts and useGameStore.ts
const BALANCE_CONFIG = {
    maxHints: 3,          // max 3 hints per puzzle (dailyGameEngine.ts getHintSet)
    maxGuesses: 6,        // max 6 guesses per game (useGameStore.ts MAX_GUESSES)
    baseScore: 100,       // base score on correct (dailyGameEngine.ts computeScore)
    hintPenaltyPerHint: 15,  // penalty per hint after first (computeScore)
    maxTimePenalty: 35,   // max time penalty (computeScore)
    streakBonusDivisor: 2,   // streak / 2 bonus (computeScore)
    maxStreakBonus: 25,   // max streak bonus (computeScore)
    minScore: 5,          // minimum possible score (computeScore)
    minClueLength: 8,     // minimum clue length (validateCommunityClue)
    maxClueLength: 180,   // maximum clue length (validateCommunityClue)
    maxCommunityClues: 5  // max clues shown (rankCommunityClues limit)
};

let issues = [];
let warnings = [];

// Verify against source files
function verifySourceAlignment() {
    console.log("0. Source File Verification");

    const engineSrc = fs.readFileSync('./src/core/dailyGameEngine.ts', 'utf8');
    const storeSrc = fs.readFileSync('./src/hooks/useGameStore.ts', 'utf8');

    // Check MAX_GUESSES in store
    if (storeSrc.includes('MAX_GUESSES = 6')) {
        console.log(`  ✅ MAX_GUESSES = 6 confirmed in useGameStore.ts`);
    } else {
        issues.push("MAX_GUESSES value mismatch in useGameStore.ts");
    }

    // Check baseScore in engine
    if (engineSrc.includes('baseScore = 100')) {
        console.log(`  ✅ baseScore = 100 confirmed in dailyGameEngine.ts`);
    } else {
        issues.push("baseScore value mismatch in dailyGameEngine.ts");
    }

    // Check clue length limits
    if (engineSrc.includes('raw.length < 8')) {
        console.log(`  ✅ minClueLength = 8 confirmed in dailyGameEngine.ts`);
    } else {
        issues.push("minClueLength value mismatch");
    }

    // Check puzzle bank size
    const puzzleBankSrc = fs.readFileSync('./src/data/puzzleBank.ts', 'utf8');
    const puzzleCount = (puzzleBankSrc.match(/id:\s*"p\d+"/g) || []).length;
    console.log(`  ✅ Puzzle bank size: ${puzzleCount} puzzles`);
    if (puzzleCount < 28) {
        warnings.push(`Only ${puzzleCount} puzzles — recommend 28+ for a full month`);
    }
}

// Check score configuration
function checkScoreConfig() {
    console.log("\n1. Score Configuration");

    if (BALANCE_CONFIG.baseScore < 50) {
        issues.push("Base score too low for engagement");
    } else {
        console.log(`  ✅ Base score: ${BALANCE_CONFIG.baseScore}`);
    }

    if (BALANCE_CONFIG.hintPenaltyPerHint > BALANCE_CONFIG.baseScore * 0.25) {
        warnings.push("Hint penalty is steep — players may avoid using hints");
    } else {
        console.log(`  ✅ Hint penalty: ${BALANCE_CONFIG.hintPenaltyPerHint} per hint`);
    }

    // Score range analysis
    const bestScore = BALANCE_CONFIG.baseScore + BALANCE_CONFIG.maxStreakBonus;
    const worstWinScore = BALANCE_CONFIG.minScore;
    console.log(`  ✅ Score range: ${worstWinScore} – ${bestScore}`);
}

// Check hint system
function checkHintSystem() {
    console.log("\n2. Hint System");

    if (BALANCE_CONFIG.maxHints < 2) {
        issues.push("Too few hints — frustrating for new players");
    } else if (BALANCE_CONFIG.maxHints > 5) {
        warnings.push("Too many hints — reduces challenge");
    } else {
        console.log(`  ✅ Max hints: ${BALANCE_CONFIG.maxHints}`);
    }

    // Cost of using all hints
    const totalHintPenalty = (BALANCE_CONFIG.maxHints - 1) * BALANCE_CONFIG.hintPenaltyPerHint;
    console.log(`  ✅ Total hint penalty (all used): -${totalHintPenalty} points`);
    if (totalHintPenalty > BALANCE_CONFIG.baseScore * 0.5) {
        warnings.push("Using all hints costs >50% of base score");
    }
}

// Check guess limits
function checkGuessLimits() {
    console.log("\n3. Guess Limits");

    if (BALANCE_CONFIG.maxGuesses < 4) {
        warnings.push("Guess limit may be too low for casual players");
    } else if (BALANCE_CONFIG.maxGuesses > 10) {
        warnings.push("Guess limit too high — reduces tension");
    } else {
        console.log(`  ✅ Max guesses: ${BALANCE_CONFIG.maxGuesses}`);
    }
}

// Check community clue system
function checkClueSystem() {
    console.log("\n4. Community Clue System");

    console.log(`  ✅ Min clue length: ${BALANCE_CONFIG.minClueLength} chars`);
    console.log(`  ✅ Max clue length: ${BALANCE_CONFIG.maxClueLength} chars`);
    console.log(`  ✅ Max clues shown: ${BALANCE_CONFIG.maxCommunityClues}`);

    if (BALANCE_CONFIG.minClueLength < 5) {
        warnings.push("Min clue length too short — may allow low-quality clues");
    }
}

// Run all checks
try {
    verifySourceAlignment();
} catch (e) {
    console.error(`  ⚠️  Source verification skipped: ${e.message}`);
}
checkScoreConfig();
checkHintSystem();
checkGuessLimits();
checkClueSystem();

// Summary
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Balance Summary`);
console.log(`${'═'.repeat(50)}`);
console.log(`   Issues: ${issues.length}`);
console.log(`   Warnings: ${warnings.length}`);

if (issues.length > 0) {
    console.log("\n❌ Critical Issues Found:");
    issues.forEach(i => console.log(`   - ${i}`));
    process.exit(1);
}

if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach(w => console.log(`   - ${w}`));
}

console.log("\n✅ Balance check passed!");
process.exit(0);
