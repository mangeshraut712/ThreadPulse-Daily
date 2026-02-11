# ThreadPulse Daily — Architecture & Design

## Overview

ThreadPulse Daily is a community-powered daily word puzzle game designed for the Reddit ecosystem. Players guess Reddit-themed words using progressive hints, then share their results with the community.

## Architecture

### Frontend (React + TypeScript)

```
src/
├── App.tsx              — App shell with timer, confetti, result modal
├── components/
│   ├── GameBoard.tsx    — Core game UI (puzzle, hints, guesses, clues)
│   ├── Confetti.tsx     — Celebration particle effects
│   └── ResultModal.tsx  — Share results modal
├── core/
│   └── dailyGameEngine.ts — Deterministic puzzle selection, scoring, validation
├── data/
│   └── puzzleBank.ts    — 35+ Reddit-themed puzzles
├── hooks/
│   ├── useGameStore.ts       — State management with localStorage persistence
│   ├── useAIAdaptive.ts      — TensorFlow.js AI features
│   ├── useAnalytics.ts       — Event tracking
│   ├── useCommunityFeatures.ts — Community clues, voting
│   ├── useGameMaker.ts       — Animation system
│   ├── useHapticFeedback.ts  — Mobile haptic patterns
│   └── useMobileGestures.ts  — Touch gesture detection
├── styles/
│   └── design-system.css — Complete design token system (700+ lines)
└── types/
    └── index.ts         — TypeScript interfaces
```

### Devvit Integration (apps/devvit)

The Devvit app creates a custom post type that embeds the ThreadPulse Daily webview within Reddit. The `<webview>` component hosts the game, enabling native Reddit integration.

### WebAssembly Engine (packages/wasm)

A Rust-based WebAssembly module provides optimized score calculation, guess validation, and AI clue analysis. The JS wrapper in `pkg/game_engine.js` provides a singleton engine interface.

### GameMaker Layer (packages/gamemaker)

CSS-based animation system with GameMaker-compatible hooks for celebration, success, error, hint-reveal, and guess-submit effects.

## Game Flow

```
1. App mounts → useGameStore.refreshGame()
2. pickDailyPuzzle() selects puzzle via date-seeded RNG
3. Player sees puzzle card with first hint
4. Player types guess → evaluateGuess() → update state
5. On correct: confetti + haptic + result modal + streak update
6. On exhaust: show answer + result modal
7. Player shares result via Reddit/X/clipboard
```

## Scoring Formula

```
score = 100 - (hintPenalty × 15) - (timePenalty / 6) + (streakBonus / 2)
```

- Minimum score: 5
- Maximum score: ~125 (perfect solve with long streak)

## Daily Puzzle Selection

Uses FNV-1a hash of the UTC date string → Mulberry32 PRNG → index into puzzle bank. This ensures:
- Same puzzle for all players on the same day
- Deterministic, reproducible selection
- No server needed for puzzle distribution

## Design Philosophy

- **Premium, minimal UI** — Glassmorphism, gradient accents, clean typography
- **Mobile-first** — Responsive layout, haptic feedback, gesture support
- **Accessible** — ARIA labels, focus rings, reduced-motion, high-contrast
- **Reddit-native** — Subreddit tags, community voting, Reddit share button
