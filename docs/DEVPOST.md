# Devpost Submission Packet — ThreadPulse Daily

Draft submission text for **Reddit's Game of the Day Hackathon 2026** (`https://redditgameofday2026.devpost.com/`, deadline **December 8, 2026 at 6:00 PM PST**).

## Basics

- **Project Name:** ThreadPulse Daily
- **Elevator Pitch:** A daily Reddit-culture word puzzle built on Devvit Interactive Posts — guess today's word in 6 tries, unlock progressive hints, vote on community clues, and keep your streak alive.
- **Live Reddit Subreddit / App:** https://www.reddit.com/r/ThreadPulse2026
- **Reddit Developer Portal:** https://developers.reddit.com/apps/threadpulsedaily
- **Public GitHub Repository:** https://github.com/mangeshraut712/ThreadPulse-Daily
- **Recorded Demo Video Asset:** `apps/devvit/assets/Demo.mov` (upload to YouTube/Vimeo before final Devpost form submit; YouTube URL: `______`)
- **Built With:** `devvit`, `typescript`, `react`, `redis`, `rust`, `webassembly`, `gamemaker`, `vite`, `pwa`

---

## Inspiration

Daily word games work best when everyone is solving the exact same puzzle and talking about it afterward. Reddit already has the richest shared vocabulary on the internet — karma, rickrolls, AMAs, banana-for-scale, subreddit lore, and platform inside jokes — so we built **ThreadPulse Daily** natively inside Reddit Interactive Posts where the puzzle, community clues, and post-solve banter live in the same place.

## What it does

Every day at **00:00 UTC**, ThreadPulse Daily serves a deterministic date-seeded puzzle to every player on Reddit:

- **6 attempts & 3 progressive hints:** Start with one free clue, submit guesses with instant visual feedback and duplicate-guess protection, and optionally spend **15 points** per extra hint when stuck.
- **Dynamic 5–125 point scoring:** Base **100 points**, time decay (`-1` per 6s, capped at `-35`), hint cost (`-15` per extra hint), and streak bonus (`+1` per 2 streak days, up to `+25`, floor `5` points).
- **Community clue loop:** Players submit clues for fellow Redditors and upvote/downvote helpful clues with Reddit-style arrows; moderators can boost standout clues.
- **Spoiler & Unicode safety:** Submitted clues strip invisible Unicode format characters before blocklist and answer-substring validation (`8–180` characters) so answers cannot be smuggled into community hints.
- **Redis-backed streaks & leaderboard:** Persistent daily streaks and rankings powered by Devvit's Redis store, plus one-tap Wordle-style emoji grid sharing.

## How we built it

- **Devvit Interactive Posts (`apps/devvit/`):** Hosts the interactive post wrapper, Redis persistence for leaderboards/clues/streaks, and bidirectional `postMessage` bridge (`devvitBridge`) to the webview client.
- **React + TypeScript Game Client (`src/`):** Deterministic puzzle selection across **35 curated Reddit-culture puzzles**, adaptive hint hooks, live monospaced timer, haptic feedback, mobile swipe gestures, dark mode, and `prefers-reduced-motion` support.
- **Rust / WebAssembly & GameMaker Effect Hooks (`packages/wasm/`, `packages/gamemaker/`):** Modular scoring/validation engine compiled to WASM alongside GameMaker-compatible celebration, hint-reveal, and guess-feedback animation hooks.
- **Automated Verification (`scripts/`):** `npm run test:self` (39 checks), `scripts/balance-check.mjs` (scoring/hint invariants), `scripts/submission-check.mjs`, and `scripts/final-verify.mjs` (56 end-to-end structure and quality checks), enforced by GitHub Actions CI (`lint`, `typecheck`, `test`, `build`).

## Challenges we ran into

- **Preventing spoiler bypasses in community clues:** Simple lowercase substring checks can be bypassed with zero-width joiners or Unicode format characters (`Cf`), so we added Unicode format-character stripping prior to answer-leak and blocklist checks, backed by dedicated unit tests.
- **Keeping daily gameplay deterministic across time zones:** Seeding puzzle rotation strictly by UTC date guarantees every player on `r/ThreadPulse2026` sees the same puzzle, hints, and leaderboard cohort simultaneously.
- **Responsive feel inside embedded webviews:** Tuning glassmorphism cards, touch targets, focus rings, and reduced-motion fallbacks so the game plays smoothly in both desktop Reddit feeds and mobile apps.

## Accomplishments that we're proud of

- **35 hand-crafted Reddit-native puzzles** with subreddit tags, progressive 3-tier hints, and balanced `5–125` point scoring.
- **Zero-warning verification suite:** All 39 self-tests, 56 final verification checks, balance checks, TypeScript checks, and CI builds pass cleanly.
- **Native community loop:** Turning spectators who already solved today's word into clue authors and voters for everyone still playing.

## What we learned

Designing for Reddit Interactive Posts rewards tight, under-two-minute sessions where social artifacts (community clues, upvotes, streak badges, and spoiler-free emoji grids) naturally spark thread replies without giving away the answer.

## What's next for ThreadPulse Daily

- Subreddit-pack customizers so moderators can launch community-specific daily puzzle seasons alongside the global Reddit pack.
- Weekly tournament flairs and seasonal streak milestones on `r/ThreadPulse2026`.
